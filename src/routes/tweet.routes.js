 import { Router } from "express";
 import { verifyJWT } from "../middlewares/auth.middleware.js";
 import{
      createTweet,
      getUserTweets,
      updateTweet,
      deleteTweet,
      getAnyUserTweets
      } from "../controllers/tweet.controller.js";
 
const router = Router();
router.use(verifyJWT); // apply to all routes in this file

router.route("/").post(createTweet);
router.route("/:tweetId").delete(deleteTweet)
                         .get(getUserTweets)
                         .patch(updateTweet);
router.route("/u/:userId").get(getAnyUserTweets);

export default router;
