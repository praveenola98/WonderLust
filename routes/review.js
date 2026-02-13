const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js")
const ExpressError = require("../utils/ExpressError")
const { listingSchema, reviewSchema } = require("../schema.js")
const Review = require("../models/review.js")
const Listing = require("../models/listing.js")
const {validateReview, isLoggedIn, isReviewAuthor} = require("../middleware.js")
const reviewController= require("../controllers/reviews.js")



//Review route
//post route
router.post('/',isLoggedIn, validateReview, wrapAsync(reviewController.newReview));

//review delete route
router.delete("/:reviewid",isReviewAuthor, wrapAsync(reviewController.destroyReview));





module.exports = router;