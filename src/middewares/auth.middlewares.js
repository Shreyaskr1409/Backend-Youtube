import { ApiError } from "../utils/ApiError.utils";
import { asyncHandler } from "../utils/asyncHandler.utils";

import jwt from "jsonwebtoken";
import { User } from "../models/user.models";

export const verifyJWT = asyncHandler( async (req, res, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorisation")?.replace("Bearer ", "")
        // cookies used here... not cookie()
    
        if(!token) {
            throw new ApiError(401, "Unauthorised request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
    
        if(!user) {
            throw new ApiError(401, "Invalid access token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})