import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
	{
		id_owner: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: "Product",
		},
		author: String,
		avatar: String,
		rating: Number,
		comment: String,
		date: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

export const ReviewsCollection = mongoose.model("reviews", reviewSchema);
