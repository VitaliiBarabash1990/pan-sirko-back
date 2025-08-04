import { model, Schema } from "mongoose";

const sectionsSchema = new Schema(
	{
		img: { type: [String], required: false },
		activeIndex: { type: Number, required: false },
		title_about: { type: String, required: true },
		description_about: { type: String, required: true },
		title_partnership: { type: String, required: true },
		description_partnership: { type: String, required: true },
		title_contact: { type: String, required: true },
		description_contact: { type: String, required: true },
		title_delivery: { type: String, required: true },
		description_delivery: { type: String, required: true },
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

export const SectionsCollection = model("sections", sectionsSchema);
