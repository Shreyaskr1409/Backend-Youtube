import mongoose from "mongoose";
import { DB_NAME } from "./constants";











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