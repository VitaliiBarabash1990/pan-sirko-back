import { CategoryCollection } from "../db/models/category.js";

export const getAllCategory = async () => {
	const foundedCategory = await CategoryCollection.find();

	return foundedCategory;
};

export const createCategory = async (payload) => {
	const createdCategory = await CategoryCollection.create(payload);
	return createdCategory;
};

export const updateCategory = async (payload) => {
	const { id, ...item } = payload;

	const updatedCategory = await CategoryCollection.findByIdAndUpdate(
		id,
		{ ...item },
		{ new: true } // Повертає оновлений документ
	);

	return updatedCategory;
};
