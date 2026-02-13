import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js"; 
import {
      addComment,
      updateComment, 
      deleteComment,
      getTweetComments,
      getVideoComments
     } from "../controllers/comment.controller.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/video/:videoId")
      .post(addComment)
      .get(getVideoComments); 
router.route("/tweet/:tweetId")
      .post(addComment)
      .get(getTweetComments);
router.route("/c/:commentId")
      .patch(updateComment)
      .delete(deleteComment);

export default router;