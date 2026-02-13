import {Router} from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { publishAVideo,
        getVideoById,
        updateVideo,
        deleteVideo,
        getAllVideos,
        togglePublishStatus,
        getAnyChannelVideos 
      } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
 
const router=Router();
router.use(verifyJWT); // apply to all routes in this file
router.route("/").post(
     upload.fields([
        {
            name:"videoFile", 
            maxCount:1
        }, 
        {
         name:"thumbnail",
         maxCount:1 
        }
     ]),
     publishAVideo
);
router.route("/:videoId").patch(upload.single("thumbnail"),updateVideo);
router.route("/:videoId").delete(deleteVideo); 
router.route("/toggle-status/:videoId").patch(togglePublishStatus); 
router.route("/:videoId").get(getVideoById);
router.route("/").get(getAllVideos); 
router.route("/c/:channelId").get(getAnyChannelVideos); 

export default router; 