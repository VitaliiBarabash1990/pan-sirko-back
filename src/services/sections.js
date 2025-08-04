import { SectionsCollection } from "../db/models/sections.js";
import { deleteFileFromCloudinary } from "../utils/deleteFileFromCloudinary.js";
import { env } from "../utils/env.js";
import { extractPublicIdFromUrl } from "../utils/extractPublicIdFromUrl.js";

export const getAllSections = async () => {
	const foundedCategory = await SectionsCollection.find();

	return foundedCategory;
};

export const createSections = async (payload) => {
	const createdCategory = await SectionsCollection.create(payload);
	return createdCategory;
};

export const updateSections = async (payload) => {
	const section = await SectionsCollection.findOne();

	if (!section) {
		// Якщо немає розділу, створюємо новий
		return await SectionsCollection.create(payload);
	}

	// Якщо Cloudinary увімкнено, видаляємо непотрібні старі зображення
	if (env("ENABLE_CLOUDINARY") === "true") {
		const incomingImgs = Array.isArray(payload.img) ? payload.img : [];
		const oldImgs = section.img || [];

		// Залишаємо тільки унікальні валідні URL
		const newImgs = incomingImgs.filter(Boolean);

		// Визначаємо, які старі зображення треба видалити
		const imagesToDelete = oldImgs.filter(
			(oldUrl) => !newImgs.includes(oldUrl)
		);

		// Видаляємо з Cloudinary
		for (const url of imagesToDelete) {
			try {
				const publicId = extractPublicIdFromUrl(url);
				await deleteFileFromCloudinary(publicId);
			} catch (err) {
				console.warn(`Failed to delete from Cloudinary: ${url}`, err.message);
			}
		}

		payload.img = newImgs;
	}

	// після того, як встановив payload.img
	if (payload.activeIndex >= payload.img.length) {
		payload.activeIndex = payload.img.length > 0 ? payload.img.length - 1 : 0;
	}

	// Якщо не передали нових зображень, залишаємо старі
	if (!payload.img) {
		payload.img = section.img || [];
	}

	// Оновлюємо документ у БД
	const updatedSection = await SectionsCollection.findByIdAndUpdate(
		section._id,
		payload,
		{ new: true, runValidators: true }
	);

	return updatedSection;
};
