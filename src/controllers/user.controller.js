import { asyncHandler } from "../utils/asyncHandler.utils.js";
import {ApiError} from "../utils/ApiError.utils.js";
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js";
import {ApiResponse} from "../utils/ApiResponse.utils.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        user.accessToken = accessToken;

        // user.save() is used for saving data.
        // while saving, the save() function takes all fields of a model as parameters
        // here we have only the values of accessToken and refreshToken

        await user.save({ validateBeforeSve: false })
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
        throw new ApiError(404, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user._id)

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
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    // we will clear out refreshToken from user in the database
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
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

export {
    registerUser,
    loginUser,
    logoutUser
}