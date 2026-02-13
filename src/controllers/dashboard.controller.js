import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Subscription} from "../models/subscription.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id;
    const totalSubscribers = await Subscription.aggregate([
        {
          $match:{
             channel:new mongoose.Types.ObjectId(userId)
            } 
        },
        {
           $group:{
            _id:null,
            subscribersCount:{
                $sum:1
            }
           }
        },
    ])
   
  const video = await Video.aggregate([
         {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
         },
         {
           $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"video",
            as:"likes"
           }  
         },
         {
           $project:{
             totalLikes:{
                $size:"$likes"
            },
             totalViews: "$views"
           }
         },
         {
            $group:{
                _id:null,
                totalVideos:{
                    $sum:1
                },
                totalLikes:{
                     $sum:"$totalLikes"
                },
                totalViews:{
                     $sum:"$totalViews"
                }
            }
         }
  ]);
  const channelStats = {
     totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
     totalVideos: video[0]?.totalVideos || 0,
     totalLikes: video[0]?.totalLikes || 0,
     totalViews: video[0]?.totalViews || 0,
  }

   return res.status(200)
    .json(new ApiResponse( 200, channelStats, "Channel stats fetched successfully"  ) );

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel owner
     const userId = req.user?._id;
     const {page = 1, limit = 10} = req.query;
     const channelVideos = Video.aggregate([
        {
           $match:{
            owner:new mongoose.Types.ObjectId(userId)
           } 
        },
        {
          $sort:{
            createdAt:-1
          }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
         {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comments"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                commentsCount:{
                    $size:"$comments"
                },
               createdAtDate:{
                    $dateToParts:{
                        date:"$createdAt"
                    }
                }
            }
        },
        {
         $project:{
            _id:1,
            title:1,
            description:1, 
            duration:1,
            views:1,
            videoFile:1,
            thumbnail:1,
            likesCount:1,
            commentsCount:1,
            createdAtDate:{
              minute:1,
              hour:1,
              day:1,
              month:1,
              year:1
            },
            isPublished:1
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
    const videos = await Video.aggregatePaginate(
        channelVideos,
        options
    )
    return res.status(200)
    .json(new ApiResponse(200, videos,"channel videos fetched successfully" ));
})

const getChannelTweets = asyncHandler(async (req, res) => {
    // TODO: Get all own tweets uploaded by a user
     const userId = req.user?._id;
     const {page = 1, limit = 10} = req.query;
     const channelTweets = Tweet.aggregate([
        {
           $match:{
            owner:new mongoose.Types.ObjectId(userId)
           } 
        },
        {
          $sort:{
            createdAt:-1
          }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"likes"
            }
        },
         {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"tweet",
                as:"comments"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                commentsCount:{
                    $size:"$comments"
                },
               createdAtDate:{
                    $dateToParts:{
                        date:"$createdAt"
                    }
                }
            }
        },
        {
         $project:{
            _id:1,
            content:1, 
            views:1,
            likesCount:1,
            commentsCount:1,
            createdAtDate:{
              minute:1,
              hour:1,
              day:1,
              month:1,
              year:1
            },
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
    const tweets = await Tweet.aggregatePaginate(
        channelTweets,
        options
    )
    return res.status(200)
    .json(new ApiResponse(200, tweets,"user tweets fetched successfully" ));
})

export {
    getChannelStats, 
    getChannelVideos,
    getChannelTweets
    }