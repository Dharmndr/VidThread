import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiErrors.js"
import { Video } from "../models/video.model.js"
import {User} from "../models/user.model.js"
import mongoose, {isValidObjectId} from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import {v2 as cloudinary} from "cloudinary";

const publishAVideo=asyncHandler(async(req,res)=>{
    // get title and description from req.body 
    const{title,description} = req.body
    // validation
    if([title,description].some((field)=>(field?.trim()===""))){
        throw new ApiError(400,"both title and description are required")
    }

   // get video file by req.files
   const videoFilePath= req.files?.videoFile[0]?.path;
   const thumbnailPath= req.files?.thumbnail[0]?.path;
   if(!videoFilePath || !thumbnailPath){
      throw new ApiError(400,"both video files and thumbnail  are required")
   }
   // uplaod to cloudinary
   const videoFile = await uploadOnCloudinary(videoFilePath);
   const thumbnail = await uploadOnCloudinary(thumbnailPath);

   if(!videoFile){
     throw new ApiError(400,"video file not uploaded successfully")
   }  
   if(!thumbnail){
     throw new ApiError(400,"thumbnail not uploaded successfully")
   }
   // create video object - create entry in db
   const video = await Video.create(
      {
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:videoFile.duration, 
        isPublished:true,
        owner:req.user?._id 
      }
   )
   // check video published or not 
   if(!video){
    throw new ApiError(500,"something went wrong while publishing the video")
   }

   return res
   .status(201)
   .json( new ApiResponse(200,video,"video published successfully"));

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params // looks like {_id:"12672"}
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(400,"video id is missing")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video id is not valid")
    }
    const exists = await Video.exists({_id:videoId});
    if(!exists){
        throw new ApiError(404,"video not found");
    }
    // write aggregation pipeline to get comments, likes and owner of  that particular video
    const video = await Video.aggregate([
        {
         $match:{
            _id:new mongoose.Types.ObjectId(videoId)
         }
        },
        // comments
        {
          $lookup:{
             from:"comments",
            localField:"_id",
            foreignField:"video",
            as:"comments",
            pipeline:[
                {
                 $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"commentOwner",
                    pipeline:[
                        {
                            $project:{
                                username:1
                            }
                        }
                    ]
                 }
                },
                {
                 $addFields:{
                    commentOwner:{
                        $first:"$commentOwner"
                    }
                 }
                },
                {
                    $project:{
                        commentOwner:1,
                        content:1,
                        createdAt:1
                    }
                }
            ]
          }
        },
        {
            $addFields:{
                commentsCount:{
                    $size:"$comments"
                }
            }
        },
        // video owner details
        {
          $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"Owner",
            pipeline:[
                {
                 $lookup:{
                    from:"subscriptions", 
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                 }
                },
                {
                    $addFields:{
                        subscribersCount:{
                            $size: "$subscribers"
                        },
                        isSubscribed:{
                            $cond:{
                                if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                                then:true,
                                else: false
                            }
                        }
                    }
                   
                },
                {
                 $project:{
                    fullName:1,
                    "avatar.url":1,
                    subscribersCount:1,
                    isSubscribed:1
                 }
                }
                
            ]
          }
        },
        // likes
        {
         $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"video",
            as:"videoLikes"

         }
        },
        {
            $addFields:{
              likesCount:{
                $size:"$videoLikes"
              },
              isLiked:{
                $cond:{
                    if:{$in:[req.user?._id,"$videoLikes.likedBy"]},
                    then:true,
                    else:false
                }
              }
            }
        },
        {
        $project:{
                "videoFile.url":1,
                Owner:1,
                likesCount:1,
                isLiked:1,
                comments:1,
                commentsCount:1,
                title:1,
                duration:1,
                description:1,
                createdAt:1,
                views:1     
        }
        }
    ]);
   

    // check if  it  exit in database
    if(!video.length){
        throw new ApiError(404,"failed to Fetch video");
    }
     //increment view by count one
     await Video.findByIdAndUpdate(
        videoId,
        {
         $inc:{views:1},
        }
     )

     //add video to user's watch history
     await User.findByIdAndUpdate(
        req.user?._id,
        {
          $addToSet:{
            watchHistory:videoId
          }  
        }
     )

    return res
    .status(200)
    .json(new ApiResponse(201,video[0],"video fetched successfully"))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description} = req.body

    if(!videoId?.trim()){
        throw new ApiError(400,"video id is missing");
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video id is not valid")
    }
    //  check is it  exit in database
     const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found ");
    }
    // check the authorized owner
    
    if(!video.owner || req.user?._id.toString()!==video.owner.toString()){
        throw new ApiError(400,"you are not authorized to update this video");
    }
    // check title,decription and thumbnail are valid or not
    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400,"title and description both are required"); 
    }
    // get thumbnail file by req.files
    const thumbnailPath = req.file?.path;
    
    if(!thumbnailPath){
        throw new ApiError(403,"thumbnail is required"); 
    }
    // update on cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailPath);
    if(!thumbnail){
         throw new ApiError(400,"Error while uploading updated thumbnail on cloudinary"); 
    }
     // have to delete old url of thumbnail from cloudinary
     // check url exist in database
    
     if(video.thumbnail){
        const public_id=video.thumbnail.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(public_id,{
            resource_type:"image"
        });
     }
  
    // update in database
   const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
        {
         $set:{
            thumbnail:thumbnail.url,
            title,
            description
         }
        },
        {
            new:true
        }
    )

    if(!updatedVideo){
        throw new ApiError(500,"something went wrong while updating the video")
    }
 
return res.status(200)
.json(new ApiResponse(200,updatedVideo,"video updated successfully"));
    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId?.trim()){
        throw new ApiError(400,"video id is missing")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video id is not valid")
    }
    // check is it  exit in database
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"video not found ");
    }
    // check the authorized owner
    if(!video.owner || req.user?._id.toString()!==video.owner.toString()){
        throw new ApiError(403,"you are not authorized to delete this video");
    }
    
    const delvideo = await Video.findByIdAndDelete(videoId);
    if(!delvideo){
        throw new ApiError(500,"something went wrong while deleting the video");
    }

     if(video.thumbnail){
        const public_id=video.thumbnail.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(public_id,{
            resource_type:"image"
        });
     }
      if(video.videoFile){
        const public_id=video.videoFile.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(public_id,{
            resource_type:"video"
        });
     }

    return res.status(200).json(new ApiResponse(200,{},"video deleted successfully"))

})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    const pipeline=[];
    if(query?.trim()){
      pipeline.push({
       $search:{
        index:"search-videos",
        text: {
            query: query,
            path: ["title","description"],
        },
       }
      });
    }
    let canOwnerSeeUnpublished = false;
    if(userId?.trim()){
        if(!mongoose.isValidObjectId(userId)){
            throw new ApiError(401,"Invalid user id");
        }
        const user=await User.findById(userId);
        if(!user){
            throw new ApiError(400,"user id not found");
        }
        if(user._id.toString()===req.user?._id.toString()){
            canOwnerSeeUnpublished=true;
        }
        pipeline.push({
          $match:{
            owner:new mongoose.Types.ObjectId(userId) // filter video owners
          }
        });
    }
    if(!canOwnerSeeUnpublished){ // if user is not the video owner
      pipeline.push({
       $match:{
        isPublished:true  //only published videos
       } 
      }); 
    }
    //sort videos by views, createdAt, duration in ascending or descending
    const allowedSort = ["views","createdAt","duration"];
    let sortField = "createdAt";
    let sortOrder = -1;
    if(sortBy?.trim() && allowedSort.includes(sortBy)){
        sortField = sortBy;
        sortOrder = sortType?.trim().toLowerCase() === "asc"? 1 : -1;
    }
    pipeline.push({
        $sort:{
            [sortField] : sortOrder
        }
    });
    const pageNum=parseInt(page,10);
    const limitNum=parseInt(limit,10);
    const finalPage= Number.isNaN(pageNum) || pageNum<1 ? 1 : pageNum;
    const finalLimit = Number.isNaN(limitNum) || limitNum< 1 ? 10 : Math.min(100,limitNum);
    
    const options={
            page: finalPage,
            limit: finalLimit
    };
    const videos = await Video.aggregatePaginate(
         Video.aggregate(pipeline),
         options
    )
    return res.status(200)
    .json(new ApiResponse(200,videos,"videos fetched successfully"));

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
     if(!videoId?.trim()){
         throw  new ApiError(404,"video id is missing");
     }
     if(!isValidObjectId(videoId)){
        throw new ApiError(400,"video id is not valid")
    }
     const video= await Video.findById(videoId);
     if(!video){
        throw new ApiError(404,"video not found");
     }

     if(!video.owner || req.user?._id.toString()!==video.owner.toString()){
        throw new ApiError(401,"you are not authorized to toggle this video");
     }
     const toggleVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished: !video?.isPublished
            }
        },
        {
            new:true
        }
     )
     if(!toggleVideo){
        throw new ApiError(500,"something went wrong while toggling publish status");
     }
     
     return res.status(201)
     .json(new ApiResponse(200,toggleVideo,"video is toggled successfully"));
})

const getAnyChannelVideos = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    const {page = 1, limit = 10} = req.query;

    if(!channelId){
        throw new ApiError(400,"channel id is missing");
    }
    if(!isValidObjectId(channelId)){
        throw new ApiError(404,"invalid channel id");
    }
    const exists = await User.exists({_id:channelId});
    if(!exists){
        throw new ApiError(404,"User channel is not found");
    }
    
    const videos =  Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(channelId),
                isPublished:true                 //only published videos
            }
        },
        {
          $sort:{
            createdAt:-1
          }
        },
        {
          $addFields:{
            createdDate:{
                $dateToParts:{
                    date:"$createdAt"
                }
            }
          }
        },
        {
           $project:{
              _id:1,
              videoFile:1,
              thumbnail:1,
              title:1,
              duration:1,
              views:1,
              createdDate:{
                minute:1,
                hour:1,
                day:1,
                month:1,
                year:1
              }
           } 
        }
    ]);

    const pageNum = parseInt(page,10);
    const limitNum = parseInt(limit,10);
    const finalPage = Number.isNaN(pageNum) || pageNum<1 ? 1:pageNum;
    const finalLimit = Number.isNaN(limitNum) || limitNum<1 ? 10: Math.min(40,limitNum);
    const options = {
        page:finalPage,
        limit: finalLimit
    }

    const channelVideos = await Video.aggregatePaginate(
        videos,
        options
    )

    return res.status(200)
    .json(new ApiResponse(200, channelVideos,"channel videos fetched successfully" ));

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAnyChannelVideos
};