const express = require("express")
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js")
const Listing = require("../models/listing.js")


const { isLoggedIn } = require("../middleware.js")
const { isOwner , validateListing} = require("../middleware.js")
const listinController= require("../controllers/listings.js")
const multer = require("multer")
const {storage}= require("../cloudConfig");
const upload = multer({storage})


// backend validate listing ----->new post form ke Schema Validation se related hai


//index route
router.route( "/")
.get(wrapAsync(listinController.index))
//ceate route matlab form fill karne ke bad kam karega 
.post(isLoggedIn, upload.single("listing[image]"), validateListing, wrapAsync(listinController.createListing));
// .post(upload.single('listing[image]'),(req, res)=>{
//     res.send(req.file)
// })


//search route
router.get("/search", async(req,res)=>{
    const {q}= req.query;
    if(!q){
        return res.redirect("/listings");
    }

    const regex = new RegExp(q, "i"); 
    const alllistings = await Listing.find({
    $or: [
      { title: regex },
      { location: regex },
      { category: regex },
      { country: regex },
      
    ]
  });
  res.render("listings/search.ejs", { alllistings, q });
});


//category route
router.get("/category", async(req,res)=>{
    const{type}=req.query; 
    let alllistings;

    if (type) {
     alllistings = await Listing.find({ category: type });
  } else {
     alllistings = await Listing.find({});
  }
  res.render("listings/categorywise.ejs", { alllistings, type });
})

//New Route
router.route("/new")
.get(isLoggedIn, listinController.renderNewForm);

//show route. 
router.route("/:id")
.get( listinController.showListing)
// update route ka hi path jo update walal form fill karne ke bad kam karrega
.patch(
    isLoggedIn, 
    isOwner, 
    upload.single("listing[image]"),
    
    wrapAsync(listinController.updateListing))

//delete route
.delete( isLoggedIn, isOwner, listinController.destroyListing);

//update route
router.route("/update/:id")
.get(isLoggedIn, wrapAsync(listinController.renderupdateform));





module.exports = router;