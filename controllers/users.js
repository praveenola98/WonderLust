const ExpressError = require("../utils/ExpressError")
const User = require("../models/user.js")

module.exports.renderSignUpform=(req, res) => {
    res.render("users/signup.ejs")
}

module.exports.postSignUp=async (req, res) => {
    try {
        let { username, email, password } = req.body;
        const newUser = new User({ username, email })
        const registerdUser = await User.register(newUser, password);
        
        // req.flash("success", "Welcome to wonderlust");
        // res.redirect("/listings");
        req.login(registerdUser, (err)=>{
        if(err){
            next(err);
        }
        req.flash("success", "Welcome to wonderlust");
        res.redirect("/listings");
    })
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
       
    }
}

module.exports.renderLoginForm=(req, res) => {
    res.render("users/login.ejs")
}

module.exports.loginPost=async (req, res) => {
        req.flash("success", "Welcome to wonderlust, you arre logged in");
        let redirectUrl = res.locals.redirectUrl || "/listings" ;
        res.redirect(redirectUrl)

    }

module.exports.logout=(req,res)=>{
    req.logout((err)=>{
     if(err){
        return next(err);
     }
     req.flash("success", "logged Out!");
     res.redirect("/listings")
    })
}