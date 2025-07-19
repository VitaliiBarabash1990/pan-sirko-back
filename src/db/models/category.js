import { model, Schema } from "mongoose";

const categorySchema = new Schema(
	{
		icon: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		type_goods: {
			type: String,
			required: true,
		},
		status_active: { type: Boolean, required: true, default: true },
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

export const CategoryCollection = model("category", categorySchema);
