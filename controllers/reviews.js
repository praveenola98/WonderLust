const ExpressError = require("../utils/ExpressError")
const Review = require("../models/review.js")
const Listing = require("../models/listing.js")

module.exports.newReview =async (req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(req.params.id);
   
    let newReview = new Review(req.body.review)
    newReview.author =req.user._id
    listing.reviews.push(newReview)
    await newReview.save();
    await listing.save();


    
    req.flash("success", "new review created");
    res.redirect(`/listings/${id}`)
}


module.exports.destroyReview=async (req, res) => {

    let { id } = req.params;
    let { reviewid } = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewid } })
    await Review.findByIdAndDelete(reviewid);
    await
        req.flash("success", "review deleted");
    res.redirect(`/listings/${id}`);
}