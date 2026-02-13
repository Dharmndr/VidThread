import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"  
import {asyncHandler} from "../utils/asyncHandler.js"


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
     const {content} =req.body
     const {tweetId,videoId} =req.params
    if(!content|| !content.trim()){
      throw new ApiError(400,"comment is required")
    }
    // provide only one resource
    if((!videoId && !tweetId) || (videoId && tweetId)){
        throw new ApiError(400,"provide either videoId or tweetId");
    }
    // validate
    if( videoId && !isValidObjectId(videoId)){
         throw new ApiError(400,"videoId is not valid");
    }  
    if(tweetId && !isValidObjectId(tweetId)){
         throw new ApiError(400,"tweetId is not valid");
    }
    // check if resource exits or not 
   if(videoId){
    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(404,"video not found");
   }
   if(tweetId){
    const tweet = await Tweet.findById(tweetId);
    if(!tweet) throw new ApiError(404,"tweet not found");
   }

    const comment =  await Comment.create({
      content,
      owner: req.user._id,
      video: videoId || null,
      tweet: tweetId || null
    });

    if(!comment){
        throw new ApiError(500,"Something went wrong while writting the comment");
    }

    return res.status(201)
    .json(new ApiResponse(201,comment,"comment  added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
       const {content} = req.body;
       const {commentId} = req.params;
        if(!isValidObjectId(commentId)){
            throw new ApiError(400,"comment id is not valid");
        }
        if(!content || !content.trim()){
             throw new ApiError(400,"new comment is required to update the old comment");
        }
        const oldComment= await Comment.findById(commentId);
        if(!oldComment){
          throw new ApiError(404,"comment not found");
        }
        if(oldComment?.owner.toString()!==req.user?._id.toString()){
          throw new ApiError(403,"you are not authorized to update this comment");
        }
        const newComment = await Comment.findByIdAndUpdate(
            commentId,
            {
              $set:{
                content
              },
           },
           {
            new: true
           }
        )
        if(!newComment){
          throw new ApiError(500,"Something went wrong while updating the comment"); 
        }
      
        return res.status(200)
        .json(new ApiResponse(200,newComment,"Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
     const {commentId} = req.params;
     if(!isValidObjectId(commentId)){
        throw new ApiError(400,"comment id is not valid");
    }
    const oldComment= await Comment.findById(commentId);
    if(!oldComment){
      throw new ApiError(404,"Comment not found");
    }
    if(oldComment.owner.toString()!==req.user?._id.toString()){
      throw new ApiError(403,"you are not authorized to delete this comment");
    }
    const delComment = await Comment.findByIdAndDelete( commentId );
    if(!delComment){
      throw new ApiError(500,"Something went wrong while deleting the comment"); 
    }
    return res.status(200)
    .json(new ApiResponse(200,{},"Comment deleted successfully"))
})

const getVideoComments = asyncHandler(async (req, res) => { 
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query;
    if(!videoId){
        throw new ApiError(400,"video id is missing");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id");
    }
    // safe check, if video exits or not 
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found");
    }
    const pageNum = parseInt(page,10);
    const limitNum = parseInt(limit,10);
    const finalPage = Number.isNaN(pageNum) || pageNum<1 ? 1:pageNum;
    const finalLimit = Number.isNaN(limitNum) || limitNum<1 ? 10: Math.min(40,limitNum);

    const comments = await Comment.paginate(
        {
         video: videoId  // filter
        },
        {
          page:finalPage,
          limit:finalLimit,
          sort:{createdAt:-1},
          populate:{
            path:"owner",
            select:"username fullName avatar.url"
          }
        }
    )
    return res.status(200)
    .json(new ApiResponse(200,comments,"video comments fetched successfully"));

})

const getTweetComments = asyncHandler(async (req, res) => { 
    //TODO: get all comments for a tweet
    const {tweetId} = req.params
    const {page = 1, limit = 10} = req.query;
    if(!tweetId){
        throw new ApiError(400,"tweet id is missing");
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"invalid tweet id");
    }
    // safe check, if tweet exits or not 
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"tweet not found"); 
    }
    const pageNum = parseInt(page,10);
    const limitNum = parseInt(limit,10);
    const finalPage = Number.isNaN(pageNum) || pageNum<1 ? 1:pageNum;
    const finalLimit = Number.isNaN(limitNum) || limitNum<1 ? 10:limitNum;

    const comments = await Comment.paginate(
        {
         tweet: tweetId // filter
        },
        {
          page: finalPage,
          limit: finalLimit,
          sort: { createdAt: -1 },
          populate: {
            path: "owner",
            select: "username fullName avatar.url"
          }
        }
    )
    return res.status(200)
    .json(new ApiResponse(200,comments,"tweet comments fetched successfully"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment,
     getTweetComments
    }
   
