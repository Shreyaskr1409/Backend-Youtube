import { asyncHandler } from "../utils/asyncHandler.utils.js";
import {ApiError} from "../utils/ApiError.utils.js";
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js";
import {ApiResponse} from "../utils/ApiResponse.utils.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        // user.accessToken = accessToken;

        // user.save() is used for saving data.
        // while saving, the save() function takes all fields of a model as parameters
        // here we have only the values of accessToken and refreshToken

        await user.save({ validateBeforeSave: false })
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler( async(req, res) => {
    // res.status(200).json({
    //     message: "OK"
    // })

    // get data from frontend
    // validation of data
    // check if user already exists
    // check for images, check for avatar
    // upload them to cloudinary, check if avatar is uploaded properly
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return user

    const {fullName, email, username, password} = req.body
    console.log("email: ", email);

    // if(fullName === "") {
    //     throw new ApiError(400, "fullname is required")
    // }

    // OR

    if(
        [fullName, username, email, password].some(
            // can use any name, not just field
            (field) => field?.trim() === ""
        )
    ) {
        throw ApiError(400, "All fields are required")
    }

    
    // now we will check if the user exists
    // User.findOne({email}) or User.findOne({username}) can be used if we want...
    // ...to find using just email or username
    // ...but to find using either one of them:
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser) {
        throw new ApiError(409, "User with this email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; we are commenting this because...
    // ...when we do not send coverImage with the request, we are getting an error due to the question marks
    // ...still unclear why
    // ...it is fixed later
    // we get files access from multer using req.files
    // avatar field consists of many options like size or format
    // first property of avatar's path can be accessed using avatar[0].path

    // this path can now be uploaded as a parameter in uploadOnCloudinary(localFilePath parameter will be avatarLocalPath)

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required: avatarLocalPath not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required: avatar upload response from uploadOnCloudinary is not found")
    }

    // notice we did not check for coverimage as it is not a requirement

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // checking if user is created
    // const createdUser = await User.findById(user._id)   this ensures that the user is created
    const createdUser = await User.findById(user._id).select( "-password -refreshToken" )

    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return res.status(201).json({createdUser})
    // OR
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Succesfully")
    )
    // .status(201) is provided because usually it is expected the status code is recieved via .status()
    // even when you use Postman, status code is recieved via .status()

} )

const loginUser = asyncHandler( async(req,res) => {
    // get data from req body
    // username or email
    // find the user
    // password check
    // access & refresh token generated and sent to the user
    // send cookies

    const {email, username, password} = req.body;

    if(!(email || username)) {
        throw new ApiError(400, "username or email required")
    }

    // now we will check if the user exists
    // User.findOne({email}) or User.findOne({username}) can be used if we want...
    // ...to find using just email or username
    // ...but to find using either one of them:

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "User does not exist")
    }

    // dont use User to get data. it is an Mongoose object.. user is the one we made
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await   generateAccessAndRefreshTokens(user._id)

    // NOW!!! the user initially did not have a refreshToken or AccessToken when he first logged in
    // we can either: 1. send query to database to update the user's fields (easier and method)
    // 2. we can update the present object and send res respectively with the tokens
    // NOW it is up to you to decide whether sending query to database is will be expensive or not...
    // we say expensive because you are actually paying for sending data for each kb

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }
    // usually cookies are modifiable by frontend, but providing httpOnly and secure as true,
    // they can only be modified by server

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            // we are sending access and refresh tokens in user because what if client is using an app...
            // ...not a browser. Then the cookies will not be saved, these values from user will be saved
            "User logged in successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    // we will clear out refreshToken from user in the database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // $set: {
            //     refreshToken: undefined
            // }

            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken  = asyncHandler( async (req, res)=> {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET
        )

        // you will get _id via decoded token (look at generateRefreshToken() in user.model.js)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

        return res
          .status(200)
          .cookie("accessToken", newAccessToken)
          .cookie("refreshToken", newRefreshToken)
          .json(
            new ApiResponse(
              200,
              {
                  newAccessToken,
                  newRefreshToken
              }
            )
          )
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid refresh token")
    }

})

const changeCurrentUserPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} =  req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler( async(req,res) => {
    return res
        .status(200)
        .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    const {fullName, email} = req.body

    if (!email || !fullName) {
        throw new ApiError(400, "All fields are required")
    }

    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                // same as fullName: fullName
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(200, user, "Account details updated successfully")
})

const updateUserAvatar = asyncHandler( async(req, res) => {
    // if req deals with multiple files, use req.files
    // else use req.file
    // files contains an array of objects, but file contains only a single object
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(200, user, "Avatar uploaded successfully")
        )
} )

const updateUserCoverImage = asyncHandler( async(req, res) => {
    // if req deals with multiple files, use req.files
    // else use req.file
    // files contains an array of objects, but file contains only a single object
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res.status(200)
        .json(
            new ApiResponse(200, user, "Cover Image uploaded successfully")
        )
} )

const getUserChannelProfile = asyncHandler( async(req,res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    // User.find({username})
    // this will be unnecessary
    // finding user, then finding id from that user, then applying aggregation pipelines...

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
                // match username: in database wither username taken from req.params
            }
        },
        {
            $lookup: {
                // we exported "Subscription" in subscriptions model
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
                // from subscriptions, using user' _id, under field "channel: ___" in subscription, as subscribers
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscriberToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscriberToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    // aggregate() returns array

    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, channel[0], "User Channel fetched successfully")
            // we returned just 1st element of channel because front end guy needs just 1 element to fill up details in frontend
        )
})

const getUserWatchHistory = asyncHandler( async(req, res) => {
    const user = await User.aggregate([
        // find user
        // get the watch history (collection of videos) from lookup
        // from those videos, lookup user for it's name, channel and avatar (the way it is displayed in youtube watch history)
        // now to make it easier for the frontend guy, instead of returning only the array of owners...
        // ...we will also return first owner as an object normally as a new field
        {
            $match: {
                // _id: req.user._id
                // this will be wrong as _id here will be a string like ObjectId("bdsvbabjvkadsv")
                // when you use mongoose with find by id, mongoose handles id and returns the user
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                },
                                {
                                    $addFields: {
                                        owner: {
                                            $first: "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200)
        .json(
            new ApiResponse(200, user[0].watchHistory, "Watch history fetched")
        )
    // aggregate() returns array. so user is an array.
    // we get the first element of array to get 1st user object which is the only object in this case
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}