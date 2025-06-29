import { SORT_ORDER } from "../constants/index.js";
import { FillersCollection } from "../db/models/fillers.js";
import { calculatePaginationData } from "../utils/calculatePaginationData.js";
import { sendEmail } from "../utils/sendMail.js";
import handlebars from "handlebars";
import path from "node:path";
import { SMTP, TEMPLATES_DIR } from "../constants/index.js";
import fs from "node:fs/promises";
import { env } from "../utils/env.js";

// export const getAllFillers = async () => {
// 	const fillers = await FillersCollection.find();
// 	return fillers;
// };

// export const getContactById = async (contactId) => {
//   const contact = await ContactsCollection.findById(contactId);
//   return contact;
// };

// export const getFilteredFillers = async (type = "fillers", page = 1) => {
// 	const firstPageLimit = 6;
// 	const nextPageLimit = 2;

// 	const isFirstPage = page === 1;
// 	const limit = isFirstPage ? firstPageLimit : nextPageLimit;
// 	const skip = isFirstPage ? 0 : firstPageLimit + (page - 2) * nextPageLimit;

// 	const query = { type_goods: type };

// 	// const fillers = await FillersCollection.find(query).skip(skip).limit(limit);

// 	const [fillers, total] = await Promise.all([
// 		FillersCollection.find(query).skip(skip).limit(limit),
// 		FillersCollection.countDocuments(query),
// 	]);

// 	return { fillers, total };
// };

export const getFilteredFillers = async (
	type_goods = "fillers",
	page = 1,
	queryParams = {}
) => {
	const firstPageLimit = 6;
	const nextPageLimit = 2;

	const isFirstPage = page === 1;
	const limit = isFirstPage ? firstPageLimit : nextPageLimit;
	const skip = isFirstPage ? 0 : firstPageLimit + (page - 2) * nextPageLimit;

	// Базовий фільтр
	const filter = { type_goods };

	// Динамічна фільтрація
	if (queryParams.type) {
		filter.type = {
			$in: Array.isArray(queryParams.type)
				? queryParams.type
				: [queryParams.type],
		};
	}

	if (queryParams.wage) {
		const wageArr = Array.isArray(queryParams.wage)
			? queryParams.wage
			: [queryParams.wage];
		filter.wage = { $in: wageArr.map(Number) };
	}

	if (queryParams.features) {
		filter.features = {
			$in: Array.isArray(queryParams.features)
				? queryParams.features
				: [queryParams.features],
		};
	}

	if (queryParams.minPrice || queryParams.maxPrice) {
		filter.price = {};
		if (queryParams.minPrice) filter.price.$gte = Number(queryParams.minPrice);
		if (queryParams.maxPrice) filter.price.$lte = Number(queryParams.maxPrice);
	}

	// Обробка сортування
	let sortOption = {};

	switch (queryParams.sort) {
		case "newest":
			sortOption = { createdAt: -1 };
			break;
		case "expensive":
			sortOption = { price: -1 };
			break;
		case "cheap":
			sortOption = { price: 1 };
			break;
		case "popular":
			sortOption = { sales_report: -1 };
			break;
		default:
			sortOption = { createdAt: -1 };
			break;
	}

	const [fillers, total, stats] = await Promise.all([
		FillersCollection.find(filter).sort(sortOption).skip(skip).limit(limit),
		FillersCollection.countDocuments(filter),
		FillersCollection.aggregate([
			{ $match: { type_goods } },
			{
				$facet: {
					type: [{ $group: { _id: "$type", count: { $sum: 1 } } }],
					wage: [{ $group: { _id: "$wage", count: { $sum: 1 } } }],
					features: [{ $group: { _id: "$features", count: { $sum: 1 } } }],
					priceRange: [
						{
							$group: {
								_id: null,
								min: { $min: "$price" },
								max: { $max: "$price" },
							},
						},
					],
				},
			},
		]),
	]);

	return {
		fillers,
		total,
		stats: stats[0] || { type: [], wage: [], features: [], priceRange: [] },
	};
};

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

export const getTopSales = async ({ skip, limit }) => {
	const [data, total] = await Promise.all([
		FillersCollection.find({})
			.sort({ sales_report: -1 }) // сортування за кількістю продажів
			.skip(skip)
			.limit(limit),
		FillersCollection.countDocuments(),
	]);

	return { data, total };
};

handlebars.registerHelper("calcTotal", (price, qty) => {
	const total = Number(price) * Number(qty);
	return total.toFixed(2);
});

export const requestSendEmail = async (order) => {
	try {
		const orderTemplatePath = path.join(
			TEMPLATES_DIR,
			"order-confirmation.html"
		);
		const templateSource = (await fs.readFile(orderTemplatePath)).toString();
		const template = handlebars.compile(templateSource);
		const html = template({
			...order,
			createdAt: new Date().toLocaleString("uk-UA"),
		});

		await sendEmail({
			from: env("SMTP_FROM"),
			to: env("SMTP_OWNER_EMAIL"),
			subject: "Нове замовлення з сайту!",
			html,
		});

		if (Array.isArray(order.items)) {
			for (const item of order.items) {
				const { id, qty } = item;
				if (!id || typeof qty !== "number") continue;

				await FillersCollection.findByIdAndUpdate(
					id,
					{ $inc: { sales_report: qty } },
					{ new: true }
				);
			}
		}
	} catch (error) {
		console.error("❌ Помилка при обробці замовлення:", error);
		throw error; // Щоб сервер повернув 500, або можеш кинути власну помилку з кодом/текстом
	}
};
