import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js"

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

router.route("/login").post(
    loginUser
)

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
// router.route("/logout").post(logoutUser) without middlewares
// router.route("/logout").post(mw1, mw2, mw3, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router