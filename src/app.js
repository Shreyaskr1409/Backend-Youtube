import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "10kb"}))
// limit of 10kb data transfer set

app.use(express.urlencoded({extended: true,
    limit: "10kb"
}))
app.use(express.static("public"))
app.use(cookieParser())


// routes import
import userRouter from './routes/user.routes.js'

// routes declaration
// app.get was used when we were writing controllers, routers all in one function
// since we have made things separately, we will bring in router using middlewares (app.use)
app.use("/api/v1/users", userRouter)
// when user goes to /users, the control will be passed to user.router.js
// from there you can route as you wish
// in this case we will go to http://localhost:8000/api/v1/users/register

export { app }