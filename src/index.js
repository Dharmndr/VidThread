
// require('dotenv').config({path: './env'});

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";

import dotenv from "dotenv";
import connectDB from "./db/index.js"; 
import {app} from "./app.js"

dotenv.config({path: './.env'});
 

// as async method gives a promise 
connectDB()
.then(()=>{ 
   // express/app error 
  app.on("error",(error)=>{
      console.log("express App error: ",error);
  })
  app.listen(process.env.PORT || 8000,()=>{
    console.log(`server is running at PORT : ${process.env.PORT}`);
  })
})
.catch((error)=>{
  console.log("Mongodb connection failed !!! ",error);
})





/*
            // first approach to connect database
import express from "express";
const  app=express();
// IIFE
( async()=>{
 try{
  await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
  // express/app error
  app.on("error",(error)=>{
      console.log("ERROR: ",error);
      throw error;
  })
  app.listen(process.env.PORT,()=>{
    console.log(`app is listening on port ${process.env.PORT}`);
  })
 }
 catch(error){
  console.log("ERROR: ",error);
  throw error;
 }
})()
 */