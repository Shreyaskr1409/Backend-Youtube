import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // I wrote ${DB_NAME} in a new line which gave a new error
        // My files were getting saved in test folder instead of videotube folder
        console.log(`\n MongoDB CONNECTED!!! Database hosted on
            ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB;