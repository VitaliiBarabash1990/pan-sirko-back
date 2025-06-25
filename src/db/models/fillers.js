import { model, Schema } from "mongoose";

const allowedTypes = ["toys", "houses", "fillers"];

const fillersSchema = new Schema(
	{
		img: { type: String, required: false },
		article: { type: String, required: false },
		stars: { type: Number, required: false },
		text: { type: String, required: false },
		description: { type: String, required: false },
		price: { type: Number, required: false },
		reviews: { type: Number, required: false },
		wages: { type: [String], required: false },
		description_title: { type: String, required: false },
		description_text: { type: String, required: false },
		benefits_title: { type: String, required: false },
		benefits_text: { type: [String], required: false },
		Regulations_title: { type: String, required: false },
		Regulations_text: { type: [String], required: false },
		sales_report: { type: Number, default: 0, required: false },
		brand: { type: String, required: false },
		view: { type: String, required: false },
		wage: { type: Number, required: false },
		volume: { type: Number, required: false },
		country: { type: String, required: false },
		qty: { type: String, required: false },
		type_goods: { type: String, enum: allowedTypes, default: "fillers" },
		isSale: { type: Boolean, required: false, default: false },
		status: { type: Boolean, required: false },
	},
	{
		timestamps: true,
		versionKey: false,
	}
);

export const FillersCollection = model("fillers", fillersSchema);
