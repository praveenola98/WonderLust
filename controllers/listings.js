const Listing = require("../models/listing.js");
const { cloudinary } = require("../cloudConfig");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    let alllistings = await Listing.find({})
    res.render("listings/index.ejs", { alllistings })

}
module.exports.renderNewForm = (req, res) => {


    res.render("listings/new.ejs")
}

module.exports.showListing = (async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: ({ path: "author" }) })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Post not availale");
        res.redirect("/listings");
    }


    res.render("listings/show.ejs", { listing })


})

module.exports.createListing = async (req, res, next) => {

    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    })
        .send();


    

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing)
    newListing.owner = req.user._id

    newListing.image = { url, filename };
    newListing.geometry=response.body.features[0].geometry;

    let savedListing= await newListing.save();
   
    req.flash("success", "New listing created successfully");

    // let{title, description, image,price,location,country}=req.body.listing;
    // await Listing.create({title,description, image,price,location,country})
    res.redirect("/listings")


}

module.exports.renderupdateform = async (req, res) => {
    let { id } = req.params
    let listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Post not availale");
        res.redirect("/listings");
    } else {
        res.render("listings/update.ejs", { listing })
    }
}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params
    let { title, description, price,location } = req.body.listing;

    let listing = await Listing.findByIdAndUpdate(id, { title, description, price }, { new: true })
    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    req.flash("success", "update successfully");
    res.redirect(`/listings/${id}`)
}

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    await Listing.findByIdAndDelete(id);
    await cloudinary.uploader.destroy(listing.image.filename);
    req.flash("success", "delete successfully");
    res.redirect("/listings")
}
