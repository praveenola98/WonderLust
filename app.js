const express = require("express")
const app = express();
const port = 3000;
const path = require("path")
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate")
const methodOverride = require("method-override");
app.use(methodOverride("_method"));
const ExpressError = require("./utils/ExpressError")
const router = express.Router();
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const cookieParser = require("cookie-parser");
app.use(cookieParser("secretcode"));
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js")
const Listing = require("./models/listing.js");
const Message = require("./models/message.js")
const http = require("http");
const { Server } = require("socket.io");







if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}
const dbUrl = process.env.ATLASDB_URL
// const dbUrl = "mongodb://127.0.0.1:27017/wonderlust"




//routes
const listingRouter = require("./routes/listing.js")
const reviewRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")
const chatRoutes = require("./routes/chat");




const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 3600,
});


store.on("error", () => {
    console.log("Errro in session storing")
})

const sessionOption = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,

    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 3,
        maxAge: 1000 * 60 * 60 * 24 * 3,
        httpOnly: true,

    }
}



app.use(session(sessionOption))
app.use(flash())

//passport.initialize() passport.session() and ko as a middlw=eware use karna
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//flash ke liye
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user || null;

    res.locals.formatTime = (date) => {
        const now = new Date();
        const msgDate = new Date(date);

        const diff = Math.floor((now - msgDate) / 1000);

        if (diff < 60) return "Just now";
        if (diff < 3600) return Math.floor(diff / 60) + " min ago";
        if (diff < 86400) return Math.floor(diff / 3600) + " hr ago";

        const days = Math.floor(diff / 86400);
        if (days === 1) return "Yesterday";
        if (days < 7) return days + " days ago";

        return msgDate.toLocaleDateString("en-IN");
    };
    next();
})

// //demouser bnaya h
// app.get("/demouser", async (req,res)=>{
// let fakeUser = new User({
//     email:"student@gmail.com",
//     username:"delta-student2"
// })
// let registereduser= await User.register(fakeUser, "helloworld");
// res.send(registereduser)
// })







// views , publics etc ke liye h
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// routes folderke liye h
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter)
app.use("/", userRouter);
app.use("/chat", chatRoutes);

// const MONGO_URL="mongodb+srv://WonderLust:<db_password>@cluster0.p6rpzla.mongodb.net/?appName=Cluster0mongodb+srv://WonderLust:Olaji@987@cluster0.p6rpzla.mongodb.net/?appName=Cluster0"


main().then((res) => { console.log("mongoo connection success") }).catch((err) => { console.log(err) })
async function main() {
    await mongoose.connect(dbUrl)
    // await mongoose.connect("mongodb://127.0.0.1:27017/wonderlust")
};


//checking

// home route
app.get("/", (req, res) => {
    res.redirect("/listings");
});
//git 





// app.get("/inbox/:id", async (req, res) => {

//     let id = req.params.id;

//     const messages = await Message.find({
//         receiver: id
//     }).populate("listing sender");

//     res.render("users/inbox.ejs", {messages});
// });
















// const haldleValidationErr=(err)=>{
//      let message ="this was a validation error";
//      return new ExpressError(400, message);
// }

// app.use((err, req,res,next)=>{
//     console.log(err.name);
//     if(err.name==="ValidationError"){

//        err= haldleValidationErr(err);
//     }
//     next(err);
// })

// jo route nhi h agar usko dsearch kar liya to ye page not found screen pe dikhayega
// app.use((req,res,next)=>{
//      next(new ExpressError(404, "Page Not Found"));
// })

// sare error finaal me yanha handle hote hai ye error.ejs ko bhejta h jo ki ek page type me error ko show karta h
app.use((err, req, res, next) => {
    let { status = 400, message = "some erroe Occure" } = err;
    res.render("Error.ejs", { message })
    // res.status(status).send(message)
})



const server = http.createServer(app);
const io = new Server(server);

app.set("io", io);

server.listen(3000, () => {
    console.log("server started");
});


io.on("connection", (socket) => {

    console.log("User connected");

    // USER PERSONAL ROOM
    socket.on("joinUserRoom", (userId)=>{
        socket.join("user_"+userId);
    });

    // CHAT ROOM
    socket.on("joinRoom", (conversationId) => {
        socket.join(conversationId);
    });

    // typing
    socket.on("typing", (data) => {
        socket.to(data.conversationId).emit("showTyping", data.username);
    });

    socket.on("stopTyping", (data) => {
        socket.to(data.conversationId).emit("hideTyping");
    });

    // SEEN MESSAGE
    socket.on("markSeen", async ({ conversationId, userId }) => {

        const Message = require("./models/message");

        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: userId },
                seenBy: { $ne: userId }
            },
            { $addToSet: { seenBy: userId } }
        );

        // double tick to room
        io.to(conversationId).emit("messagesSeen", {});

        // remove green dot in inbox
        io.to("user_"+userId).emit("updateInboxSeen",{conversationId});
    });

    // SEND MESSAGE
    socket.on("sendMessage", async (data) => {

        const Message = require("./models/message");
        const Conversation = require("./models/conversation");

        const msg = await Message.create({
            conversation: data.conversationId,
            sender: data.senderId,
            text: data.text,
            seenBy: [data.senderId]
        });

        await Conversation.findByIdAndUpdate(data.conversationId,{
            lastMessage:data.text,
            updatedAt:new Date()
        });

        // ✅ IMPORTANT FIX — send to entire room (both users)
        io.to(data.conversationId).emit("receiveMessage",{
            text:data.text,
            sender:data.senderId,
            username:data.username,
            conversationId:data.conversationId
        });

        // inbox update
        io.to(data.conversationId).emit("updateInbox",{
            conversationId:data.conversationId,
            lastMessage:data.text,
            sender:data.senderId
        });

    });

});
io.on("connection", (socket) => {

    console.log("User connected");

    // USER PERSONAL ROOM
    socket.on("joinUserRoom", (userId)=>{
        socket.join("user_"+userId);
    });

    // CHAT ROOM
    socket.on("joinRoom", (conversationId) => {
        socket.join(conversationId);
    });

    // typing
    socket.on("typing", (data) => {
        socket.to(data.conversationId).emit("showTyping", data.username);
    });

    socket.on("stopTyping", (data) => {
        socket.to(data.conversationId).emit("hideTyping");
    });

    // SEEN MESSAGE
    socket.on("markSeen", async ({ conversationId, userId }) => {

        const Message = require("./models/message");

        await Message.updateMany(
            {
                conversation: conversationId,
                sender: { $ne: userId },
                seenBy: { $ne: userId }
            },
            { $addToSet: { seenBy: userId } }
        );

        // double tick to room
        io.to(conversationId).emit("messagesSeen", {});

        // remove green dot in inbox
        io.to("user_"+userId).emit("updateInboxSeen",{conversationId});
    });

    // SEND MESSAGE
    socket.on("sendMessage", async (data) => {

        const Message = require("./models/message");
        const Conversation = require("./models/conversation");

        const msg = await Message.create({
            conversation: data.conversationId,
            sender: data.senderId,
            text: data.text,
            seenBy: [data.senderId]
        });

        await Conversation.findByIdAndUpdate(data.conversationId,{
            lastMessage:data.text,
            updatedAt:new Date()
        });

        // ✅ IMPORTANT FIX — send to entire room (both users)
        io.to(data.conversationId).emit("receiveMessage",{
            text:data.text,
            sender:data.senderId,
            username:data.username,
            conversationId:data.conversationId
        });

        // inbox update
        io.to(data.conversationId).emit("updateInbox",{
            conversationId:data.conversationId,
            lastMessage:data.text,
            sender:data.senderId
        });

    });

});
