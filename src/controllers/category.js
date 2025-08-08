import {
	createCategory,
	getAllCategory,
	updateCategory,
} from "../services/category.js";
import { env } from "../utils/env.js";
import { saveFileToCloudinary } from "../utils/saveFileToCloudinary.js";
import { saveFileToUploadDir } from "../utils/saveFileToUploadDir.js";

export const getCategoryController = async (req, res) => {
	const category = await getAllCategory();

	res.json({
		status: 200,
		message: "Successfully found category!",
		data: category,
	});
};

export const createCategoryController = async (req, res) => {
	const icon = req.file;

	let iconUrl;

	if (icon) {
		if (env("ENABLE_CLOUDINARY") === "true") {
			iconUrl = await saveFileToCloudinary(icon);
		} else {
			iconUrl = await saveFileToUploadDir(icon);
		}
	}

	const createdCategory = await createCategory({
		...req.body,
		icon: iconUrl,
	});

	res.status(201).json({
		status: 201,
		message: "Successfully data!",
		data: createdCategory,
	});
};

export const updateCategoryController = async (req, res) => {
	const { id, icon_deleted, ...restBody } = req.body;

	const updateData = { ...restBody };

	// let iconUrl = null;

	if (req.file) {
		const iconUrl =
			env("ENABLE_CLOUDINARY") === "true"
				? await saveFileToCloudinary(req.file)
				: await saveFileToUploadDir(req.file);
		updateData.icon = iconUrl;
	} else if (icon_deleted === "true") {
		// iconUrl = "";
		updateData.icon = "";
	}

	const updatedCategory = await updateCategory({
		id,
		...updateData,
		// ...req.body,
		// icon: iconUrl,
	});

	res.status(200).json({
		status: 200,
		message: "Category successfully updated!",
		data: updatedCategory,
	});
};
