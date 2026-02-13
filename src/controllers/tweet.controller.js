import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import {User} from "../models/user.model.js"
import mongoose, {isValidObjectId} from "mongoose";


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} =req.body
    if(!content|| !content.trim()){
      throw new ApiError(400,"tweet content is required")
    }
    const createTweet =  await Tweet.create({ 
      content:content,
      owner:req.user._id
    });

    if(!createTweet){
        throw new ApiError(500,"Something went wrong while publishing the tweet");
    }

    return res.status(201)
    .json(new ApiResponse(201,createTweet,"Tweet  published successfully"));
}) 
 
const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {tweetId} = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweet id is not valid");
    }

    // write aggregation pipeline to get comments, likes and owner of  that particular Tweet
    const tweet= await Tweet.aggregate([
      {
        $match:{
          _id:new mongoose.Types.ObjectId(tweetId)
        },
      },
       // comments
      {
       $lookup:{
        from:"comments",
        localField:"_id",
        foreignField:"tweet",
        as:"tweetComment",
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
            $size:"$tweetComment"
          }
        }
      },
      // tweet owner details 
      {
        $lookup:{
          from:"users",
          localField:"owner",
          foreignField:"_id",
          as:"tweetOwner",
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
                isSubscribed:{
                  $cond:{
                    if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                  }
                }
              }
            },
            {
             $project:{
              fullName: 1,
              avatar:1,
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
        foreignField:"tweet",
        as:"tweetLike",
       }
      },
      {
        $addFields:{
          likesCount:{
            $size:"$tweetLike"
          },
         isLiked:{
          $cond:{
            if:{$in:[req.user?._id,"$tweetLike.likedBy"]},
            then:true,
            else:false
          }
         } 
        }
      },
      {
        $project:{
          content:1,
          likesCount:1,
          isLiked:1,
          createdAt:1,
          tweetOwner:1,
          tweetComment:1,
          commentsCount:1,
          views:1
        }
      }
    ]);
   
    // check if  it  exit in database
    if(!tweet.length){
        throw new ApiError(404,"failed to Fetch Tweet");
    }
     //increment view by count one
     await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $inc:{views:1},
      }
     );
    
     return res
     .status(200)
     .json(new ApiResponse(200,tweet[0],"Tweet fetched successflly"))
    
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweet id is not valid");
    }
    if(!content || !content.trim()){
         throw new ApiError(400,"tweet is required to update the old tweet");
    }
    const oldTweet= await Tweet.findById(tweetId);
    if(!oldTweet){
      throw new ApiError(404,"Tweet not found");
    }
    if(oldTweet?.owner.toString()!==req.user?._id.toString()){
      throw new ApiError(403,"you are Unauthorized to update this tweet");
    }
    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
          $set:{
            content
          },
       },
       {
        new: true
       }
    )
    if(!newTweet){
      throw new ApiError(500,"Something went wrong while updating the tweet"); 
    }
  
    return res.status(200)
    .json(new ApiResponse(200,newTweet,"Tweet updated successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
     const {tweetId} = req.params;
     if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweet id is not valid");
    }
    const oldTweet= await Tweet.findById(tweetId);
    if(!oldTweet){
      throw new ApiError(404,"Tweet not found");
    }
    if(oldTweet.owner.toString()!==req.user?._id.toString()){
      throw new ApiError(403,"you are Unauthorized to delete this tweet");
    }
    const delTweet = await Tweet.findByIdAndDelete( tweetId );
    if(!delTweet){
      throw new ApiError(500,"Something went wrong while deleting the tweet"); 
    }
    return res.status(200)
    .json(new ApiResponse(200,{},"Tweet deleted successfully"))

})

const getAnyUserTweets = asyncHandler(async(req,res)=>{
    const {userId} = req.params
    const {page = 1, limit = 10} = req.query;

    if(!userId){
        throw new ApiError(400,"user id is missing");
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(404,"invalid user id");
    }
    const exists = await User.exists({_id:userId});
    if(!exists){
        throw new ApiError(404,"User is not found");
    }
    
    const tweets =  Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
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

    const userTweets = await Tweet.aggregatePaginate(
        tweets,
        options
    )

    return res.status(200)
    .json(new ApiResponse(200, userTweets,"user tweets fetched successfully" ));

})

// note : it is like twitter(x) and is different from youtube post , 
// as it contains how many people views this post, which youtube post does not includes.

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAnyUserTweets
};


