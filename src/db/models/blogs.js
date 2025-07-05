import { model, Schema } from "mongoose";

const blogsSchema = new Schema(
	{
		question: {
			type: String,
			required: true,
		},
		answer: {
			type: String,
			required: true,
		},
		img: {
			type: String,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

export const BlogsCollection = model("blogs", blogsSchema);
