import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
 

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400,"playlist name and description both are required");
    }
    
    const playlist=await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
        })
     
     return res.status(201)
     .json(new ApiResponse(201,playlist,"video playlist created successfully!"));
})

   //TODO: get user playlists
const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    const {page,limit}=req.query
    if(!userId?.trim()){
       throw new ApiError(400,"user id is missing");
    }
    if(!isValidObjectId(userId)){
         throw new ApiError(400,"invalid user id");
    }

    const pageNum=parseInt(page,10);
    const limitNum=parseInt(limit,10);
    const finalPage = Number.isNaN(pageNum) || pageNum<1 ? 1 : pageNum;
    const finalLimit = Number.isNaN(limitNum) || limitNum<1 ? 1 : Math.min(40,limitNum);
    const options = {
       page: finalPage,
       limit: finalLimit,
       sort: {createdAt : -1}
    }

   const userPlaylist = await Playlist.paginate(
    {
        owner: userId  // filter
    },
    options
   );

   if(userPlaylist.docs.length===0){
      return res.status(200)
     .json(new ApiResponse(200,userPlaylist,"no playlist yet"));
   }
   return res.status(200)
   .json(new ApiResponse(200,userPlaylist,"user playlist is fetched successfully"));

})
    //TODO: get playlist by id
const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId?.trim()){
       throw new ApiError(400,"playlist id is missing");
    }
    if(!isValidObjectId(playlistId)){
         throw new ApiError(400,"invalid playlist id");
    }

    const playlist = await Playlist.findById(playlistId)
    .populate("videos","videoFile.url thumbnail title duration views createdAt");

    if(!playlist){
         throw new ApiError(404,"playlist not found");
    }
    return res.status(200)
    .json(new ApiResponse(200,playlist,"playlist fetched successfully"));
    
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId?.trim() || !videoId?.trim() ){
       throw new ApiError(400,"playlist id and video id both are required");
    }
    if(!isValidObjectId(playlistId)){
         throw new ApiError(400,"invalid playlist id");
    }
    if(!isValidObjectId(videoId)){
         throw new ApiError(400,"invalid video id");
    }
    const exists = await Video.exists({_id:videoId});
    if(!exists){
        throw new ApiError(404,"video does not exists");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"playlist not found");
    }

    if(req.user?._id.toString()!==playlist.owner.toString()){
         throw new ApiError(403,"you are not authorized to add video in this playlist");
    }

const addVideo = await Playlist.findByIdAndUpdate(playlistId,
    {
        $addToSet:{
          videos:videoId // prevent duplicates
        }, 
    },
    {
        new: true
    },
);

return res.status(200)
.json(new ApiResponse(200,addVideo,"video is added successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!playlistId?.trim() || !videoId?.trim() ){
       throw new ApiError(400,"playlist id and video id both are required");
    }
    if(!isValidObjectId(playlistId)){
         throw new ApiError(400,"invalid playlist id");
    }
    if(!isValidObjectId(videoId)){
         throw new ApiError(400,"invalid video id");
    }
    const exists = await Video.exists({_id:videoId});
    if(!exists){
        throw new ApiError(404,"video does not exists");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"playlist not found");
    }

    if(req.user?._id.toString()!==playlist.owner.toString()){
         throw new ApiError(403,"you are not authorized to remove video from this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
           $pull:{
              videos:videoId
           } 
        },
        {
            new:true
        }
    );

    return res.status(200)
    .json(new ApiResponse(200,updatedPlaylist,"video is successfully removed from playlist"))


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    
    if(!playlistId?.trim()){
       throw new ApiError(400,"playlist id is missing");
    }
    if(!isValidObjectId(playlistId)){
         throw new ApiError(400,"invalid playlist id");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"playlist not found");
    }

    if(req.user?._id.toString()!==playlist.owner.toString()){
         throw new ApiError(403,"you are not authorized to delete this playlist");
    }
    
    await Playlist.findByIdAndDelete(playlistId);
    
    return res.status(200)
    .json(new ApiResponse(200,{},"playlist deleted successfully"))


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
     
    if(!playlistId?.trim()){
       throw new ApiError(400,"playlist id is missing");
    }
    if(!isValidObjectId(playlistId)){
         throw new ApiError(400,"invalid playlist id");
    }
    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"playlist not found");
    }
    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400,"playlist name and description both are required");
    }

    if(req.user?._id.toString()!==playlist.owner.toString()){
         throw new ApiError(403,"you are not authorized to update this playlist");
    }
     const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
         $set:{
           name,
           description,
         }
        },
        {
            new:true
        }
     )
     return res.status(201)
     .json(new ApiResponse(200,updatedPlaylist,"video playlist updated successfully!"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}