import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.db.js";
import { app } from "./app.js";





// require('dotenv').config({path: './env'});
import dotenv from "dotenv";
dotenv.config({path: './env'})
// this is recently introduced in dotenv and only available using an experimental feature
// use -r dotenv/config --experimental-json-modules in the 'dev' script
// once this feature is not experminetal, remove the --exper.. so on




connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log("The server is listening at port");
    })
})
.catch((err) => {
    console.log("MongoDB connection failed!!! ", err);
})









/*
// APPROACH 1: connecting database in index.js

import express from express;
const app = express();

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/
            ${DB_NAME}`)
            app.on("error", () => {
                console.error("Error: ", error)
                throw error
            })
        
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/