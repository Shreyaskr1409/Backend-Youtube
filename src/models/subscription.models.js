import mongoose from "mongoose"
import {Schema} from "mongoose"

const subscriptionSchema = new mongoose.Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
})

export const Subscription = mongoose.models("Subscription", subscriptionSchema)