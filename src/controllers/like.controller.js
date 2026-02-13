import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import {Tweet} from "../models/tweet.model.js"
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import mongoose, {isValidObjectId} from "mongoose";

const toggleVideoLike = asyncHandler(async(req,res)=>{
  const {videoId} = req.params;
  //TODO: toggle like on video 
  if(!videoId){
    throw new ApiError(400,"video id is missing");
  }
  if(!isValidObjectId(videoId)){
    throw new ApiError(400,"invalid video id");
  }
  const exists = await Video.exists({_id: videoId});
  if(!exists){
    throw new ApiError(404,"video not found");
  } 
  // check if it was liked earlier
  const isLiked = await Like.findOne(
    {
     video: videoId,
     likedBy: req.user._id
    }
    );
  if(isLiked){
   const unlike = await Like.findByIdAndDelete(isLiked._id);
     
    if(!unlike){
        throw new ApiError(500,"something went wrong while doing unlike to video");
    }

    return res.status(200)
    .json(new ApiResponse(201,{liked:false},"video unliked successfully"));
  }

  // if not liked yet

  const like = await Like.create({
    video: videoId,
    likedBy:req.user._id
  })
  if(!like){
    throw new ApiError(500,"something went wrong while doing like to video");
  }

  return res.status(200)
  .json(new ApiResponse(201,{liked:true},"video liked successfully"));

}) 

const toggleCommentLike = asyncHandler(async(req,res)=>{
     const {commentId} = req.params
       //TODO: toggle like on comment
  if(!commentId){
    throw new ApiError(400,"comment id is missing");
  }
  if(!isValidObjectId(commentId)){
    throw new ApiError(400,"invalid comment id");
  }
  const exists = await Comment.exists({_id: commentId});
  if(!exists){
    throw new ApiError(404,"comment not found");
  } 
   // check if it was liked earlier
  const isLiked = await Like.findOne(
    {
     comment: commentId,
     likedBy: req.user?._id
    }
    );
  if(isLiked){
   const unlike = await Like.findByIdAndDelete(isLiked?._id);
     
    if(!unlike){
        throw new ApiError(500,"something went wrong while doing unlike to comment");
    }

    return res.status(200)
    .json(new ApiResponse(201,{liked:false},"comment unliked successfully"));
  }
   // if not liked yet

  const like = await Like.create({
    comment: commentId,
    likedBy:req.user?._id
  })
  if(!like){
    throw new ApiError(500,"something went wrong while doing like to comment");
  }

  return res.status(200)
  .json(new ApiResponse(201,{liked:true},"comment liked successfully"));


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
    throw new ApiError(400,"tweet id is missing");
  }
  if(!isValidObjectId(tweetId)){
    throw new ApiError(400,"invalid tweet id");
  }
  const exists = await Tweet.exists({_id: tweetId});
  if(!exists){
    throw new ApiError(404,"tweet not found");
  } 

  // check if tweet is already liked
  const isLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id
  });
  if(isLiked){
    const unlike = await Like.findByIdAndDelete(isLiked?._id);
    if(!unlike){
        throw new ApiError(400,"something went wrong while doing unlike to tweet");
    }
    return res.status(200)
    .json(new ApiResponse(201,{liked:false},"tweet unliked successfully"));
  }

  // if not liked yet
  const like=await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id
  });
  if(!like){
    throw new ApiError(500,"something went wrong while doing like to tweet");
  }

  return res.status(200)
  .json(new ApiResponse(201,{liked:true},"tweet liked successfully"));

});

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {page = 1, limit = 10} = req.query;

    const pageNum = parseInt(page,10);
    const limitNum = parseInt(limit,10);
    const finalPage = Number.isNaN(pageNum) || pageNum<1 ? 1:pageNum;
    const finalLimit = Number.isNaN(limitNum) || limitNum<1 ? 10:limitNum;

    const options = {
      page: finalPage,
      limit: finalLimit
    }

    const pipeline = [
      {
        $match:{
          likedBy: new mongoose.Types.ObjectId(req.user?._id)
        }
      },
      {
        $lookup:{
          from:"videos",
          localField:"video",
          foreignField:"_id",
          as:"videos",
          pipeline:[
            {
              $lookup:{
                  from:"users",
                  localField:"owner",
                  foreignField:"_id",
                  as:"ownerDetails",
              }
            },
            {
              $unwind:{
                path:"$ownerDetails", // to deconstruct the array to object
                preserveNullAndEmptyArrays: true  // preserve deleted users
              }  
            }
          ]
        }
      },
      {
        $unwind:"$videos"
      },
      {
        $sort:{
          createdAt: -1 // like createdAt
        }
      },
      {
        $project:{
          videos:{
            "videoFile.url":1,
            "thumbnail.url":1,
            owner:1,
            title:1,
            description: 1,
            views: 1,
            duration: 1,
            createdAt: 1, // video createdAt
            isPublished:1,
            ownerDetails:{
              username:1,
              fullName:1,
              "avatar.url":1
            }
          }
        }
      }
    ]

     const likes = await Like.aggregatePaginate(
      pipeline,
      options
    )
  
    
    return res.status(200)
    .json(new ApiResponse(200,likes,"liked videos fetched successfully"));

})

const getLikedTweets = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {page = 1, limit = 10} = req.query;

    const pageNum = parseInt(page,10);
    const limitNum = parseInt(limit,10);
    const finalPage = Number.isNaN(pageNum) || pageNum<1 ? 1:pageNum;
    const finalLimit = Number.isNaN(limitNum) || limitNum<1 ? 10:limitNum;

    const options = {
      page: finalPage,
      limit: finalLimit
    }

    const pipeline = [
      {
        $match:{
          likedBy: new mongoose.Types.ObjectId(req.user?._id)
        }
      },
      {
        $lookup:{
          from:"tweets",
          localField:"tweet",
          foreignField:"_id",
          as:"tweets",
          pipeline:[
            {
              $lookup:{
                  from:"users",
                  localField:"owner",
                  foreignField:"_id",
                  as:"ownerDetails",
              }
            },
            {
              $unwind:{
                path:"$ownerDetails", // to deconstruct the array to object
                preserveNullAndEmptyArrays: true  // preserve deleted users
              } 
            }
          ]
        }
      },
      {
        $unwind:"$tweets"
      },
      {
        $sort:{
          createdAt: -1 // like createdAt
        }
      },
      {
        $project:{
          tweets:{
            content:1,
            owner:1, 
            views: 1,
            createdAt: 1, // tweet created time
            ownerDetails:{
              username:1,
              fullName:1,
              "avatar.url":1
            }
          }
        }
      }
    ]

    const likes = await Like.aggregatePaginate(
      pipeline,
      options
    )
  
    return res.status(200)
    .json(new ApiResponse(200,likes,"liked tweets fetched successfully"));

})

export{
     toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedTweets
}