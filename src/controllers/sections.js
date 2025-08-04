import {
	createSections,
	getAllSections,
	updateSections,
} from "../services/sections.js";
import { env } from "../utils/env.js";
import { saveFileToCloudinary } from "../utils/saveFileToCloudinary.js";
import { saveFileToUploadDir } from "../utils/saveFileToUploadDir.js";

export const getSectionsController = async (req, res) => {
	const category = await getAllSections();

	res.json({
		status: 200,
		message: "Successfully found category!",
		data: category,
	});
};

export const createSectionsController = async (req, res) => {
	console.log("FormData", req.body);
	const icons = req.files;

	let imgUrls = [];

	if (icons && icons.length > 0) {
		for (const icon of icons) {
			let imgUrl;
			if (env("ENABLE_CLOUDINARY") === "true") {
				imgUrl = await saveFileToCloudinary(icon);
			} else {
				imgUrl = await saveFileToUploadDir(icon);
			}
			imgUrls.push(imgUrl);
		}
	}

	const createdSections = await createSections({
		...req.body,
		img: imgUrls,
	});

	res.status(201).json({
		status: 201,
		message: "Successfully data!",
		data: createdSections,
	});
};

export const updateSectionsController = async (req, res) => {
	try {
		const uploadedFiles = req.files || [];
		const body = req.body;

		const incomingImgs = [];

		const formImgsRaw = body["img[]"];
		if (Array.isArray(formImgsRaw)) {
			incomingImgs.push(...formImgsRaw.filter(Boolean));
		} else if (typeof formImgsRaw === "string" && formImgsRaw) {
			incomingImgs.push(formImgsRaw);
		}

		for (const file of uploadedFiles) {
			const cloudinaryUrl = await saveFileToCloudinary(file);
			incomingImgs.push(cloudinaryUrl);
		}

		// Тепер поправляємо activeIndex, щоб не було виходу за межі масиву
		let activeIndex = Number(body.activeIndex) || 0;

		if (activeIndex >= incomingImgs.length) {
			activeIndex = incomingImgs.length > 0 ? incomingImgs.length - 1 : 0;
		}

		const updated = await updateSections({
			...body,
			activeIndex,
			img: incomingImgs,
		});

		res.status(200).json({
			status: 200,
			message: "Sections successfully updated!",
			data: updated,
		});
	} catch (error) {
		console.error("UpdateSectionsController error:", error);
		res.status(500).json({
			status: 500,
			message: "Something went wrong",
			data: error.message,
		});
	}
};
