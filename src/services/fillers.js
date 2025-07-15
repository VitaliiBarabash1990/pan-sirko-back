import { SORT_ORDER } from "../constants/index.js";
import { FillersCollection } from "../db/models/fillers.js";
import { calculatePaginationData } from "../utils/calculatePaginationData.js";
import { sendEmail } from "../utils/sendMail.js";
import handlebars from "handlebars";
import path from "node:path";
import { SMTP, TEMPLATES_DIR } from "../constants/index.js";
import fs from "node:fs/promises";
import { env } from "../utils/env.js";
import { ReviewsCollection } from "../db/models/reviews.js";
import { reply } from "../db/models/reply.js";

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

// export const getFilteredFillers = async (
// 	type_goods = "",
// 	page = 1,
// 	queryParams = {}
// ) => {
// 	const firstPageLimit = 6;
// 	const nextPageLimit = 2;

// 	const isFirstPage = page === 1;
// 	const limit = isFirstPage ? firstPageLimit : nextPageLimit;
// 	const skip = isFirstPage ? 0 : firstPageLimit + (page - 2) * nextPageLimit;

// 	// Базовий фільтр
// 	// const filter = { type_goods };

// 	const filter = {};
// 	if (type_goods) {
// 		filter.type_goods = type_goods;
// 	}

// 	// Динамічна фільтрація
// 	if (queryParams.type) {
// 		filter.type = {
// 			$in: Array.isArray(queryParams.type)
// 				? queryParams.type
// 				: [queryParams.type],
// 		};
// 	}

// 	if (queryParams.wage) {
// 		const wageArr = Array.isArray(queryParams.wage)
// 			? queryParams.wage
// 			: [queryParams.wage];
// 		filter.wage = { $in: wageArr.map(Number) };
// 	}

// 	if (queryParams.features) {
// 		filter.features = {
// 			$in: Array.isArray(queryParams.features)
// 				? queryParams.features
// 				: [queryParams.features],
// 		};
// 	}

// 	if (queryParams.minPrice || queryParams.maxPrice) {
// 		filter.price = {};
// 		if (queryParams.minPrice) filter.price.$gte = Number(queryParams.minPrice);
// 		if (queryParams.maxPrice) filter.price.$lte = Number(queryParams.maxPrice);
// 	}

// 	// Обробка сортування
// 	let sortOption = {};

// 	switch (queryParams.sort) {
// 		case "newest":
// 			sortOption = { createdAt: -1 };
// 			break;
// 		case "expensive":
// 			sortOption = { price: -1 };
// 			break;
// 		case "cheap":
// 			sortOption = { price: 1 };
// 			break;
// 		case "popular":
// 			sortOption = { sales_report: -1 };
// 			break;
// 		default:
// 			sortOption = { createdAt: -1 };
// 			break;
// 	}

// 	const [fillers, total, stats] = await Promise.all([
// 		FillersCollection.find(filter).sort(sortOption).skip(skip).limit(limit),
// 		FillersCollection.countDocuments(filter),
// 		FillersCollection.aggregate([
// 			// { $match: { type_goods } },
// 			// { $match: type_goods ? { type_goods } : {} },
// 			{ $match: filter },
// 			{
// 				$facet: {
// 					type: [{ $group: { _id: "$type", count: { $sum: 1 } } }],
// 					wage: [{ $group: { _id: "$wage", count: { $sum: 1 } } }],
// 					features: [{ $group: { _id: "$features", count: { $sum: 1 } } }],
// 					priceRange: [
// 						{
// 							$group: {
// 								_id: null,
// 								min: { $min: "$price" },
// 								max: { $max: "$price" },
// 							},
// 						},
// 					],
// 				},
// 			},
// 		]),
// 	]);

// 	return {
// 		fillers,
// 		total,
// 		stats: stats[0] || { type: [], wage: [], features: [], priceRange: [] },
// 	};
// };

export const getFilteredFillers = async (
	type_goods = "",
	page = 1,
	queryParams = {}
) => {
	const { firstPageLimit = 6, nextPageLimit = 2, ...filters } = queryParams;

	const isFirstPage = page === 1;
	const limit = isFirstPage ? firstPageLimit : nextPageLimit;
	const skip = isFirstPage ? 0 : firstPageLimit + (page - 2) * nextPageLimit;

	const filter = {};
	if (type_goods) {
		filter.type_goods = type_goods;
	}

	if (filters.type) {
		filter.type = {
			$in: Array.isArray(filters.type) ? filters.type : [filters.type],
		};
	}

	if (filters.wage) {
		const wageArr = Array.isArray(filters.wage) ? filters.wage : [filters.wage];
		filter.wage = { $in: wageArr.map(Number) };
	}

	if (filters.features) {
		filter.features = {
			$in: Array.isArray(filters.features)
				? filters.features
				: [filters.features],
		};
	}

	if (filters.minPrice || filters.maxPrice) {
		filter.price = {};
		if (filters.minPrice) filter.price.$gte = Number(filters.minPrice);
		if (filters.maxPrice) filter.price.$lte = Number(filters.maxPrice);
	}

	let sortOption = {};
	switch (filters.sort) {
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
			{ $match: filter },
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

export const createReview = async (data) => {
	return await ReviewsCollection.create(data);
};

export const getReviewsWithReplies = async (id_owner) => {
	const reviews = await ReviewsCollection.find({ id_owner }).lean();

	if (!reviews.length) return [];

	const reviewIds = reviews.map((r) => r._id);
	const allReplies = await reply.find({ commentId: { $in: reviewIds } }).lean();

	const reviewsWithReplies = reviews.map((review) => {
		// Відфільтровуємо репліки, що належать цьому коментарю
		const repliesForReview = allReplies.filter(
			(r) => r.commentId.toString() === review._id.toString()
		);

		// Будуємо дерево для цих реплік
		const repliesTree = buildRepliesTree(repliesForReview, null);

		return {
			...review,
			replies: repliesTree,
		};
	});

	return reviewsWithReplies;
};

// рекурсивна функція, що будує дерево реплік
const buildRepliesTree = (allReplies, parentId = null) => {
	return allReplies
		.filter((reply) => {
			if (parentId === null) {
				return reply.parentReplyId === null;
			}
			return reply.parentReplyId?.toString() === parentId.toString();
		})
		.map((reply) => ({
			...reply, // просто spread без toObject()
			replies: buildRepliesTree(allReplies, reply._id),
		}));
};

export const createReply = async ({
	reviewId,
	parentReplyId = null,
	author,
	comment,
	date = new Date(),
}) => {
	return await reply.create({
		commentId: reviewId,
		parentReplyId,
		author,
		comment,
		date,
	});
};

export const deleteReview = async (reviewId) => {
	// 1. Видаляємо всі репліки, які належать цьому рев’ю
	await Reply.deleteMany({ commentId: reviewId });

	// 2. Видаляємо сам рев’ю
	const deletedReview = await ReviewsCollection.findByIdAndDelete(reviewId);

	return deletedReview;
};

export const deleteReply = async (replyId, reviewId) => {
	// Рекурсивна функція для видалення всіх дітей
	const deleteChildren = async (parentId) => {
		const children = await reply.find({ parentReplyId: parentId });
		for (const child of children) {
			await deleteChildren(child._id);
			await reply.findByIdAndDelete(child._id);
		}
	};

	// Знаходимо і видаляємо основну репліку
	const deletedReply = await reply.findOneAndDelete({
		_id: replyId,
		commentId: reviewId,
	});

	if (!deletedReply) return null;

	// Видаляємо всі вкладені рекурсивно
	await deleteChildren(replyId);

	return deletedReply;
};

export const getFillerById = async (fillerId) => {
	return FillersCollection.findOne({ _id: fillerId });
};

export const createFiller = async (payload) => {
	const filler = await FillersCollection.create(payload);
	return filler;
};

export const deleteFiller = async (id) => {
	const filler = await FillersCollection.findOneAndDelete({
		_id: id,
	});
	return filler;
};

export const updateFiller = async (id, payload, options = {}) => {
	const rawResult = await FillersCollection.findOneAndUpdate(
		{ _id: id },
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
