const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({

    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },

    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    lastMessage: {
        type: String,
        default: ""
    }

}, { timestamps: true });

module.exports = mongoose.model("Conversation", conversationSchema);
