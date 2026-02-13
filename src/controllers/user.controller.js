import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiErrors.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import {v2 as cloudinary } from "cloudinary"; 

// access and refresh toekn generator method
const generateAccessAndRefreshToken = async(userId)=>{
  try{ 
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken(); 
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave:false}); 
    return {accessToken,refreshToken};
  }
  catch(error){
    throw new ApiError(500,"Something went wrong while generating access and refresh Token");
  }
}

const registerUser=asyncHandler(async(req,res)=>{
    // steps:---->
    // get user details from frontend
    // validation  - not empty
    // check if user already exist: by username,email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and  refresh token field from response
    // check for user creation 
    // return res
 const {username,fullName,email,password} =  req.body

  // validation
    if(
       [fullName,email,password,username].some((field)=>(field?.trim()===""))
    ){
       throw new ApiError(400,"All fields are required");
    }
    // check if user already exist: by username,email
    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }
    // check for images, check for avatar  given  by user
    const avatarLocalPath =   req.files?.avatar[0]?.path;  // req.files is an object and avatar is an array inside this object

    let  coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocalPath =  req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }
    //  upload them to cloudinary, avatar

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
   if(!avatar){
      throw new ApiError(400,"Error while uploading avatar to cloudinary");
   }
    if(!coverImage){
      throw new ApiError(400,"Error while uploading cover image to cloudinary");
   }
   // create user object - create entry in db
   const user=await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar:avatar.url,
    coverImage: coverImage?.url || ""
   })
   // remove password and  refresh token field from response
   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )
   // check for user creation 
   if(!createdUser){
   throw new ApiError(500,"something went wrong while registering user")
   }
   // return res
   return res.status(201).json(
    new ApiResponse(200,createdUser,"User Registered Successfully")
   )

})

const loginUser = asyncHandler(async(req,res)=>{
    // steps:
    // req body -> data
    // username or email
    // find  the user
    // password check
    // access and refresh token generation
    // send cookies
   
    // req body -> data
    const {email,username,password}  = req.body;
    // username or email
    if(!username && !email){
        throw new ApiError(400,"username or email is required");
    }
     // find  the user
    const user = await User.findOne({ 
        $or:[{username},{email}]
    })
    if(!user){
        throw new ApiError(404,"User does not exist");
    }
      // password check
    const isPasswordValid =  await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials");
    }
     // access and refresh token generation
    const {accessToken ,refreshToken} = await generateAccessAndRefreshToken(user._id);
    
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

     // send cookies
     const options = {   // can't be modified by frontend except server
        httpOnly:true,   
        secure:true
     }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options) // set
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser,accessToken,refreshToken
            },
            "User logged In successFully"
        )
    )

})

const logoutUser  = asyncHandler(async(req,res)=>{
    // steps: as here we have not direct access of user._id , so we have created a new middleware auth.middleware.js to get access of user._id
      
    // make refreshToken undefined
    await User.findByIdAndUpdate(
            req.user._id,
            {
              $unset:{
                refreshToken:1 // this removes the field  from document
              }   
            },
            {
               new:true
            }
    )

    // delete cookies
     const options = {   // can't be modified by frontend except server
        httpOnly:true,   
        secure:true
     }
     return res
     .status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json(new ApiResponse(200,{},"User logged out"))
    
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken //encrypted token
  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request");
  }

  try {
    const decodedToken = jwt.verify( // verify and checks signature and validity and decoded the encryped token
          incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET
        )
    const user= await User.findById(decodedToken._id);
     if(!user){
      throw new ApiError(401,"invalid refresh token");
    }
    // compare both the refresh tokens
    if(incomingRefreshToken!==user?.refreshToken){
      throw new ApiError(401,"refresh token is expired or invalid");
    }
     
    const options ={
      httpOnly:true,
      secure:true
    }
  
  const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id);
  
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newRefreshToken,options)
   .json(
    new ApiResponse(
      200,
      {accessToken,refreshToken:newRefreshToken},
      "Access token refreshed"
    )
   )
  } catch (error) {
     throw new ApiError(401,error?.message || "Invalid refresh token")
  }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
   const {oldPassword,newPassword} =req.body
   const user = await User.findById(req.user?._id);
   const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password");
   }

   user.password=newPassword;
   await user.save({validateBeforeSave:false}) 

   return res
   .status(200)
   .json(new ApiResponse(200,{},"Password changed successfully"))

})

const getCurrentUser= asyncHandler(async(req,res)=>{
  return res
  .status(200)
  .json( new ApiResponse(200,req.user,"Current user fetched successfully"));
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body
  if(!fullName || !email){
    throw new ApiError(400,"All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email:email
      }
    },
    {new:true}
  ).select("-password");

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account details updated successfully"));

})

const updateUserAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if(!avatar.url){
    throw new ApiError(400,"Error while uploading updated avatar on cloudinary");
  }
  
   //TODO: delete old image - assignment (hint - delete after uploading new file on cloudinary, hint- take url of old avatar) 
   // Delete the old avatar from Cloudinary if it exists
    if (req.user?.avatar) {
      const public_id = req.user.avatar.split("/").pop().split(".")[0]; // contains  base name(avatar123) of the avatar file for url like https://example.com/images/avatar123.png 
      await cloudinary.uploader.destroy(public_id,{
        resource_type:"image"
      });
    }

 const user=  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Avatar image updated successfully"))

})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath ){
    throw new ApiError(400,"Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading updated cover image on cloudinary");
  }

  //TODO: delete old image - assignment (hint - delete after uploading new file on cloudinary, hint- take url of old avatar) 
   // Delete the old avatar from Cloudinary if it exists
    if (req.user.coverImage) {
      const public_id = req.user.coverImage.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(public_id,{
        resource_type:"image"
      });
    }

 const user=  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"cover image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
   const {username} = req.params // to get url 
   if(!username?.trim()){
    throw new ApiError(400,"username is missing");
   }
   
   const channel = await User.aggregate([
    {
      $match:{
        username: username?.toLowerCase()
      } 
    },
    {
       $lookup:{
        from:"subscriptions",
        localField:"_id",  // field of user
        foreignField:"channel", // field of subscription
        as:"subscribers"  // new array field called: subscribers, will be  returned inside User 
       }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size: "$subscribers"
        },
        channelsSubscribedToCount:{
          $size: "$subscribedTo"
        },
        isSubscribed:{
            $cond: {
              if:{$in: [req.user?._id, "$subscribers.subscriber"]},
              then: true,
              else : false
            }
          }
      }
    },
    {
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
   ])
   console.log(channel); // returns an  array containing objects

   if(!channel?.length){
    throw new ApiError(400,"channel does not exist")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(200, channel[0], "User channel fetched successfully ")
   )
  
})

const getWatchHistory = asyncHandler(async(req,res)=>{
   const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id) // as during pipeline in aggregate req.user._id is a string of mongoose not an actual id of mongoDB , so be careful while using agrregate pipeline
      }
    },
    {
      $lookup:{  // joins documents of two collections
        from: "videos",
        localField: "watchHistory", // users watch history
        foreignField:"_id",  // video _id matches with watchHistory IDs
        as:"watchHistory",   // name as watch History returns full video documents that are matched with ids 
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner", // returns full user document that are matched with id, If i didn't use subpipeline for project
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{ // it will help to give object values of owner array(as pipeline returns an array) to frontend
              owner:{ 
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
   ])

   return res
   .status(200)
   .json(new ApiResponse(200, user[0].watchHistory, "watch history fetched successfully"));
})


export { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
   getWatchHistory 
};