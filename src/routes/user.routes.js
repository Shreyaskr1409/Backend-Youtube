import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

import {upload} from "../middewares/multer.middlewares.js"

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

export default router