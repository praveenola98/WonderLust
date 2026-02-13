const mongoose = require("mongoose");
const Review = require("./review.js");
const { required } = require("joi");

const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image: {
     url:String,
     filename:String
    },

    price: {
        type: Number,
    },
    location: {
        type: String,
    },
    country: {
        type: String
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    geometry:{
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  category:{
    type:String,
    enum: ['mountains',"Rooms","Iconic Cities", "Castles","Amazing Pools","Camping","Farm","Arctic","Snow Hills", "forest" ,"HighWay Side", "Town", "Hostel", 'River Side']
  }

})



listingSchema.post("findOneAndDelete", async (listing) => {

    if (listing) {
        let result = await Review.deleteMany({ _id: { $in: listing.reviews } })

    }
})







const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;