import { Router } from "express";
import {
    changeCurrentUserPassword, getCurrentUser, getUserChannelProfile, getUserWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage,
} from "../controllers/user.controller.js"

import {upload} from "../middewares/multer.middlewares.js"
import { verifyJWT } from "../middewares/auth.middlewares.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)
// in case you want to add login route: router.route("/login").post(login)



router.route("/login").post(loginUser)
// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
// router.route("/logout").post(logoutUser) without middlewares
// router.route("/logout").post(mw1, mw2, mw3, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword)
router.route("/current-user").post(verifyJWT, getCurrentUser)
router.route("/update-details").patch(verifyJWT, updateAccountDetails)
// patch used to update
// POST creates a resource. PUT replaces a resource. PATCH updates a resource. DELETE removes a resource.
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getUserWatchHistory)

export default router