import { SORT_ORDER } from "../constants/index.js";
import { FillersCollection } from "../db/models/fillers.js";
import { calculatePaginationData } from "../utils/calculatePaginationData.js";

export const getAllFillers = async () => {
	const fillers = await FillersCollection.find();
	return fillers;
};

// export const getContactById = async (contactId) => {
//   const contact = await ContactsCollection.findById(contactId);
//   return contact;
// };

export const getFillerById = async (fillerId, userId) => {
	return FillersCollection.findOne({ _id: fillerId, userId });
};

export const createFiller = async (payload) => {
	const filler = await FillersCollection.create(payload);
	return filler;
};

export const deleteFiller = async (fillerId, userId) => {
	const filler = await FillersCollection.findOneAndDelete({
		_id: fillerId,
		userId,
	});
	return filler;
};

export const updateFiller = async (fillerId, userId, payload, options = {}) => {
	const rawResult = await FillersCollection.findOneAndUpdate(
		{ _id: fillerId, userId },
		payload,
		{ new: true, includeResultMetadata: true, ...options }
	);

	if (!rawResult || !rawResult.value) return null;

	return {
		filler: rawResult.value,
		isNew: Boolean(rawResult?.lastErrorObject?.upserted),
	};
};
