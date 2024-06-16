import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser)
// in case you want to add login route: router.route("/login").post(login)

export default router