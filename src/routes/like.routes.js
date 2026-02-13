import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
     toggleVideoLike,
     toggleTweetLike,
     toggleCommentLike,
     getLikedTweets,
     getLikedVideos
     } from "../controllers/like.controller.js";
 
const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/tweet").get(getLikedTweets);
router.route("/video").get(getLikedVideos);

export default router;