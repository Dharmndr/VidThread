import {Router} from "express";
import {loginUser,
        logoutUser,
        registerUser,
        refreshAccessToken,
        changeCurrentPassword,  
        getCurrentUser,
        updateAccountDetails, 
        updateUserAvatar, 
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory 
    } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router= Router()
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
         { 
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);
 
router.route("/login").post(loginUser)  
router.route("/refresh-token").post(refreshAccessToken); // jwt has used in the controller already

//secured routes
router.use(verifyJWT); //apply to all below routes in this file

router.route("/logout").post(logoutUser) 
router.route("/change-password").post(changeCurrentPassword);
router.route("/current-user").get(getCurrentUser);
router.route("/account").patch(updateAccountDetails); 
router.route("/avatar").patch(upload.single("avatar"),updateUserAvatar); 
router.route("/cover-image").patch(upload.single("coverImage"),updateUserCoverImage); 
router.route("/c/:username").get(getUserChannelProfile);  
router.route("/history").get(getWatchHistory);


export default router  