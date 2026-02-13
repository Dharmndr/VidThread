import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiErrors.js" 
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js" 

 
 
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
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

    if(req.user?._id.toString()===channelId.toString()){
       throw new ApiError(400,"can not subsrcibe to your own channel");
    }

    const isSubscribed = await Subscription.findOne({
        channel:channelId,
        subscriber:req.user._id  
    })
    if(isSubscribed){
       const unSubscribe = await Subscription.findByIdAndDelete(isSubscribed._id);
       if(!unSubscribe){
        throw new ApiError(500,"something went wrong while unsubscribing the channel");
       }
       return res.status(200)
       .json(new ApiResponse(200,{subscribed:false},"channel got unsubscribed successfully"));
    }
    const subscribe = await Subscription.create({
       channel: channelId,
       subscriber:req.user._id
    })

    if(!subscribe){
    throw new ApiError(500,"something went wrong while subscribing the channel");
    }
    return res.status(200)
    .json(new ApiResponse(200,{subscribed:true},"channel got subscribed successfully"));
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
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

    if(req.user?._id.toString()!==channelId.toString()){
       throw new ApiError(400,"only the owner of this channel can see the list of his subscribers");
    }
    const pipeline = [
        {
            $match:{
                channel : new mongoose.Types.ObjectId(channelId) // owner
            }
        },
        {
            $sort:{
                createdAt: -1 
                }
        },
        {
          $lookup:{
            from:"users",
            localField:"subscriber",
            foreignField:"_id",
            as:"subscribers",
            pipeline:[
              {
                 $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribedToSubscriber" // subscriber's subscriber
                }
              },
              {
                $addFields:{
                    subscribedToSubscriber:{
                        $in:[
                         new mongoose.Types.ObjectId(channelId),
                        "$subscribedToSubscriber.subscriber"]
                    }
                }
              }
            ]
          }   
        },
        {
            $unwind:"$subscribers"
        },
        {
            $project:{
               subscribers:{
                 _id: 1,
                 fullName:1,
                 "avatar.url":1,
                 username:1,
                 subscribedToSubscriber:1
               }
            }
        }
    ];

    const pageNum = parseInt(page,10);
    const limitNum = parseInt(limit,10);
    const finalPage = Number.isNaN(pageNum) || pageNum<1 ? 1:pageNum;
    const finalLimit = Number.isNaN(limitNum) || limitNum<1 ? 10:limitNum;

    const options = {
      page: finalPage,
      limit: finalLimit
    }
     
    const subscribers = await Subscription.aggregatePaginate(
          Subscription.aggregate(pipeline),
          options
        )
      
    if(subscribers.docs.length===0){
         throw new ApiError(404, "No subscribers found");
    }

    return res.status(200)
    .json(new ApiResponse(200,subscribers,"Subscribers fetched successfully"));

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
     const {page = 1, limit = 10} = req.query;

    if(!subscriberId){
        throw new ApiError(400,"subscriber id is missing");
    }
    if(!isValidObjectId(subscriberId)){
        throw new ApiError(404,"invalid subscriber id");
    }
    const exists = await User.exists({_id:subscriberId});
    if(!exists){
        throw new ApiError(404,"subscriber is not found");
    }
 
    const pipeline=[
        {
            $match:{
                subscriber : new mongoose.Types.ObjectId(subscriberId) 
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedChannels",
                pipeline:[
                    {
                        $lookup:{
                            from:"videos",
                            localField:"_id",
                            foreignField:"owner",
                            as:"videos",
                            pipeline:[
                                { $match: { isPublished: true } }, // hide unpublished videos
                                {
                                    $sort:{
                                        createdAt:-1 // newest first
                                    }
                                },
                                {
                                    $limit:1   // only latest video
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            latestVideos:{
                                $first:"$videos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$subscribedChannels"
        },
        {
            $project:{
                subscribedChannels:{
                    _id:1,
                    username:1,
                    fullName:1,
                    "avatar.url":1,
                    latestVideos:{
                        _id: 1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        duration: 1,
                        title: 1,
                        createdAt: 1,
                        description: 1,
                        owner: 1,
                    }
                }
            }
        }
    ]

    const pageNum = parseInt(page,10);
    const limitNum = parseInt(limit,10);
    const finalPage = Number.isNaN(pageNum) || pageNum<1 ? 1:pageNum;
    const finalLimit = Number.isNaN(limitNum) || limitNum<1 ? 10:limitNum;

    const options = {
      page: finalPage,
      limit: finalLimit
    }
    
    const subscribedChannel = await Subscription.aggregatePaginate(
          Subscription.aggregate(pipeline),
          options
        )
      
    if(subscribedChannel.docs.length===0){
         throw new ApiError(404, "No subscribed channel found");
    }

    return res.status(200)
    .json(new ApiResponse(200,subscribedChannel,"Subscribed Channel fetched successfully"));

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}