import {ApiError} from "../utils/ApiErrors.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    const payload = {
        status: "OK",
        message: "Service is healthy", 
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    };

    return res.status(200).json(new ApiResponse(200, payload, "Service healthy"));
})

export {
    healthcheck
    }
    