import { asyncHandler } from "../utils/asyncHandler.utils.js";
import {ApiError} from "../utils/ApiError.utils.js";
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.utils.js";
import {ApiResponse} from "../utils/ApiResponse.utils.js"

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

export {registerUser}