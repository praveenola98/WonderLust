const Joi = require("joi")

module.exports.listingSchema= Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        country: Joi.string().required(),
        category: Joi.string().valid(
      "mountains",
      "Rooms",
      "Iconic Cities",
      "Castles",
      "Amazing Pools",
      "Camping",
      "Farm",
      "Arctic",
      "Snow Hills",
      "forest",
      "HighWay Side",
      "Town",
      "Hostel",
      "River Side"
    ).required(),

        price: Joi.number().required().min(0),
        image: Joi.string().allow("", null),
    }).required()
})


module.exports.reviewSchema= Joi.object({
    review: Joi.object({
        rating: Joi.string().required().min(0).max(5),
        comment: Joi.string().required(),
        
    }).required()
})