import { model, Schema } from "mongoose";

const usersSchema = new Schema(
	{
		name: { type: String, required: true },
		second_name: { type: String, required: false },
		phone: { type: String, required: false },
		email: {
			type: String,
			required: true,
			unique: true,
		},
		avatar: {
			type: String,
			required: false,
		},
		password: { type: String, required: true },
		role: {
			type: String,
			enum: ["user", "admin", "manager"],
			default: "user",
		},
	},
	{ timestamps: true, versionKey: false }
);

usersSchema.methods.toJSON = function () {
	const obj = this.toObject();
	delete obj.password;
	return obj;
};

export const UsersCollection = model("users", usersSchema);
