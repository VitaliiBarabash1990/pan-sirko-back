import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
	{
		commentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "ReviewsCollection",
			required: true,
		},
		parentReplyId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "reply",
			default: null,
		},
		author: String,
		comment: String,
		date: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

export const reply = mongoose.model("reply", replySchema);
