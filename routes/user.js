const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js")
const ExpressError = require("../utils/ExpressError")
const User = require("../models/user.js")
const passport = require("passport");
const  {saveRedirectUrl} = require("../middleware.js")
const userController = require("../controllers/users.js")

// sign up form
router.route("/signup")
.get(userController.renderSignUpform)

// signup concept
.post( userController.postSignUp)


//login form
router.route("/login")
.get(userController.renderLoginForm)


//login concept
.post(saveRedirectUrl, passport.authenticate('local',
        {
            failureRedirect: "/login",
            failureFlash: true
        }),
    userController.loginPost)


// logout
router.get("/logout", userController.logout)







module.exports = router;