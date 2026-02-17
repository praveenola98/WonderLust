const express = require("express");
const router = express.Router();
const Listing = require("../models/listing");
const Conversation = require("../models/conversation");
const Message = require("../models/message");
const mongoose = require("mongoose");


//for inbox
router.get("/inbox", async (req, res) => {

    if (!req.isAuthenticated()) {
        req.flash("error", "Login first");
        return res.redirect("/login");
    }

    const allConversations = await Conversation.find({
        participants: req.user._id
    })
        .populate("listing")
        .populate("participants")
        .sort({ updatedAt: -1 });

    
    for (let convo of allConversations) {

        const lastMsg = await Message.findOne({ conversation: convo._id })
            .sort({ createdAt: -1 });

        if (!lastMsg) {
            convo.unread = false;
            continue;
        }

        
        if (
            lastMsg.sender.toString() !== req.user._id.toString() &&
            !lastMsg.seenBy.map(id => id.toString()).includes(req.user._id.toString())
        ) {
            convo.unread = true;
        } else {
            convo.unread = false;
        }
    }

    const yourListings = [];
    const yourInquiries = [];

    allConversations.forEach(convo => {
        if (convo.listing.owner.equals(req.user._id)) {
            yourListings.push(convo);
        } else {
            yourInquiries.push(convo);
        }
    });

    res.render("chat/inbox.ejs", { yourListings, yourInquiries });
});




// start chat
router.get("/start/:listingId", async (req, res) => {

    if (!req.isAuthenticated()) {
        req.flash("error", "Please login first");
        return res.redirect("/login");
    }

    const listing = await Listing.findById(req.params.listingId);

    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }

    const ownerId = listing.owner;
    const userId = req.user._id;

    // khud ki listing pe chat nahi
    if (ownerId.equals(userId)) {
        req.flash("error", "You cannot chat on your own listing");
        return res.redirect(`/listings/${listing._id}`);
    }

    // find existing conversation
    let conversation = await Conversation.findOne({
        listing: listing._id,
        participants: { $all: [userId, ownerId] }
    });

    // create if not exists
    if (!conversation) {
        conversation = await Conversation.create({
            listing: listing._id,
            participants: [userId, ownerId]
        });
    }

    res.redirect(`/chat/${conversation._id}`);
});


//open chat
router.get("/:conversationId", async (req, res) => {

    if (!req.isAuthenticated()) {
        req.flash("error", "Login first");
        return res.redirect("/login");
    }

   
    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
        req.flash("error", "Invalid chat");
        return res.redirect("/chat/inbox");
    }

    const conversation = await Conversation.findById(req.params.conversationId)
        .populate("participants")
        .populate("listing");

    if (!conversation) {
        req.flash("error", "Chat not found");
        return res.redirect("/chat/inbox");
    }

    const messages = await Message.find({
        conversation: conversation._id
    }).populate("sender");

    await Message.updateMany(
        {
            conversation: conversation._id,
            sender: { $ne: req.user._id },      // sirf dusre bande ke
            seenBy: { $ne: req.user._id }
        },
        {
            $addToSet: { seenBy: req.user._id }
        }
    );


    res.render("chat/chat.ejs", { conversation, messages });

});


// send message (fallback http)
router.post("/:conversationId", async (req, res) => {

    if (!req.isAuthenticated()) {
        req.flash("error", "Login first");
        return res.redirect("/login");
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.conversationId)) {
        req.flash("error", "Invalid chat");
        return res.redirect("/chat/inbox");
    }

    const { text } = req.body;

    if (!text || text.trim() === "") {
        return res.redirect(`/chat/${req.params.conversationId}`);
    }

    await Message.create({
        conversation: new mongoose.Types.ObjectId(req.params.conversationId),
        sender: new mongoose.Types.ObjectId(req.user._id),
        text: text,
        seenBy: [new mongoose.Types.ObjectId(req.user._id)]
    });

    await Conversation.findByIdAndUpdate(req.params.conversationId, {
        lastMessage: text,
        updatedAt: new Date()
    });

    req.app.get("io").to(req.params.conversationId).emit("messagesSeen", {
    userId: req.user._id.toString()
});


    res.redirect(`/chat/${req.params.conversationId}`);
});


module.exports = router;
