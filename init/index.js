const mongoose = require("mongoose")
const initData = require("./data.js")
const Listing = require("../models/listing.js")

main().then((res)=>{console.log("mongoo connection success")}).catch((err)=>{console.log(err)})
async function main(){
      await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust")
}

const initDB= async()=>{
  await Listing.deleteMany({})
  initData.data=initData.data.map((obj)=>({...obj, owner:"69898cfa33cda66a4a9674fa"}))
  await Listing.insertMany(initData.data)
}
initDB();