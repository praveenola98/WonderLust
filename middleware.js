const Listing = require("./models/listing.js")
const Review = require("./models/review.js")
const ExpressError = require("./utils/ExpressError")
const { listingSchema, reviewSchema } = require("./schema.js")

module.exports.isLoggedIn = (req,res,next)=>{
   
      if(!req.isAuthenticated()){
        // redirecturl save
        req.session.redirectUrl=req.originalUrl
        req.flash("error", "you must be logged in to create listing")
        return res.redirect("/login")
    }
    next();
}


module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
}


module.exports.isOwner =async (req,res,next)=>{
    let { id } = req.params
            
            let listing = await Listing.findById(id)
            if(!listing.owner._id.equals(res.locals.currUser._id)){
                req.flash("error", "you are not the owner")
                return res.redirect(`/listings/${id}`)
            }
            next()
}


module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg)
    }
    next();
}


// backend validate listing ----->revview form ke Schema Validation se related hai

module.exports.validateReview = (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);

    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg)
    }
    next();
}

module.exports.isReviewAuthor =async (req,res,next)=>{
    let {id, reviewid } = req.params
            let { title, image, description, price } = req.body;
            let review = await Review.findById(reviewid)
            if(!review.author._id.equals(res.locals.currUser._id)){
                req.flash("error", "you are not the author")
                return res.redirect(`/listings/${id}`)
            }
            next()
}