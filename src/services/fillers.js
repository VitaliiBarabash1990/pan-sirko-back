// import { SORT_ORDER } from "../constants/index.js";
import { FillersCollection } from "../db/models/fillers.js";
// import { calculatePaginationData } from "../utils/calculatePaginationData.js";
import { sendEmail } from "../utils/sendMail.js";
import handlebars from "handlebars";
import path from "node:path";
import { SMTP, TEMPLATES_DIR } from "../constants/index.js";
import fs from "node:fs/promises";
import { env } from "../utils/env.js";
import { ReviewsCollection } from "../db/models/reviews.js";
import { reply } from "../db/models/reply.js";
// import { sendTelegramMessage } from "../utils/telegram.js";
import { escapeHtml } from "../utils/escapeHtml.js";
import { chunkAndSend } from "../utils/chunkTelegram.js";

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
	const {
		firstPageLimit = 6,
		nextPageLimit = 2,
		onlyReviewed,
		...filters
	} = queryParams;

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

	// ✅ Додаємо пошук по article або text
	if (filters.search) {
		const searchRegex = { $regex: filters.search, $options: "i" };
		filter.$or = [{ article: searchRegex }, { text: searchRegex }];
	}

	// ✅ Додаємо фільтр за count_reviews > 0
	if (onlyReviewed) {
		filter.count_reviews = { $gt: 0 };
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
	// console.log("Data", data);
	const { id_owner } = data;
	if (id_owner && typeof id_owner === "string") {
		await FillersCollection.findByIdAndUpdate(
			id_owner,
			{ $inc: { count_reviews: 1 } },
			{ new: true }
		);
	}
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
	id_owner,
	reviewId,
	parentReplyId = null,
	author,
	comment,
	avatar,
	date = new Date(),
}) => {
	// console.log("Data", data);
	// const { id_owner } = data;
	if (id_owner && typeof id_owner === "string") {
		await FillersCollection.findByIdAndUpdate(
			id_owner,
			{ $inc: { count_reviews: 1 } },
			{ new: true }
		);
	}
	return await reply.create({
		id_owner,
		commentId: reviewId,
		parentReplyId,
		author,
		avatar,
		comment,
		date,
	});
};

export const deleteReview = async (reviewId) => {
	// 1. Видаляємо всі репліки, які належать цьому рев’ю
	await reply.deleteMany({ commentId: reviewId });

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
		// Обрізаємо description для кожного товару
		if (Array.isArray(order.items)) {
			const maxLength = 75; // кількість символів
			order.items = order.items.map((item) => {
				if (item.description && typeof item.description === "string") {
					if (item.description.length > maxLength) {
						item.description = item.description.slice(0, maxLength) + "...";
					}
				}
				return item;
			});
		}

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

// export const requestSendTelegram = async (order) => {
// 	try {
// 		let msg = `<b>📦 Нове замовлення з сайту</b>\n\n`;
// 		msg += `🕒 Дата: ${new Date().toLocaleString("uk-UA")}\n`;

// 		if (order.name) msg += `👤 Ім'я: ${order.name}\n`;
// 		if (order.phone) msg += `📞 Телефон: ${order.phone}\n`;
// 		if (order.city) msg += `🏙 Місто: ${order.city}\n`;
// 		if (order.street) msg += `🚪 Вулиця: ${order.street}\n`;
// 		if (order.house) msg += `🏠 Будинок: ${order.house}\n`;
// 		if (order.department) msg += `📦 Відділення: ${order.department}\n`;
// 		if (order.post) msg += `🏤 Поштовий індекс: ${order.post}\n`;
// 		if (order.address) msg += `📍 Адреса: ${order.address}\n`;
// 		if (order.method) msg += `🚚 Спосіб доставки: ${order.method}\n`;
// 		if (order.payment) msg += `💳 Оплата: ${order.payment}\n`;
// 		if (order.comment) msg += `💬 Коментар: ${order.comment}\n`;
// 		if (order.call) msg += `📞 Телефонний дзвінок: ${order.call}\n`;

// 		msg += `\n`;

// 		if (Array.isArray(order.items) && order.items.length > 0) {
// 			msg += `<b>🛒 Список товарів:</b>\n`;
// 			order.items.forEach((item, idx) => {
// 				msg += `\n${idx + 1}. <b>${item.text}</b>`;
// 				if (item.article) msg += `\n   🔖 Артикул: ${item.article}`;
// 				if (item.description) msg += `\n   📝 Опис: ${item.description}`;
// 				if (item.qty) msg += `\n   📦 Кількість: ${item.qty}`;
// 				if (item.wage) msg += `\n   ⚖️ Вага: ${item.wage}`;
// 				if (item.discounted_price)
// 					msg += `\n   💲 Ціна: ${item.discounted_price} грн`;
// 				if (item.qty && item.discounted_price) {
// 					const total = (item.qty * item.discounted_price).toFixed(2);
// 					msg += `\n   💰 Разом: <b>${total} грн</b>`;
// 				}
// 				msg += `\n`;
// 			});
// 		} else {
// 			msg += `❌ Товари не вказані\n`;
// 		}

// 		await sendTelegramMessage(env("TELEGRAM_CHAT_ID"), msg);
// 	} catch (error) {
// 		console.error("❌ Помилка при обробці замовлення:", error);
// 		throw error;
// 	}
// };

export const requestSendTelegram = async (order) => {
	try {
		// 1) Обрізання description як у поштовій версії
		if (Array.isArray(order.items)) {
			const maxLength = 75;
			order.items = order.items.map((item) => {
				if (item?.description && typeof item.description === "string") {
					if (item.description.length > maxLength) {
						item.description = item.description.slice(0, maxLength) + "...";
					}
				}
				return item;
			});
		}

		// 2) Формування повідомлення (HTML-safe)
		const createdAt = new Date().toLocaleString("uk-UA");

		let msg = `<b>📦 Нове замовлення з сайту</b>\n\n`;
		msg += `🕒 Дата: ${escapeHtml(createdAt)}\n`;

		if (order.name) msg += `👤 Ім'я: ${escapeHtml(order.name)}\n`;
		if (order.phone) msg += `📞 Телефон: ${escapeHtml(order.phone)}\n`;
		if (order.city) msg += `🏙 Місто: ${escapeHtml(order.city)}\n`;
		if (order.street) msg += `🚪 Вулиця: ${escapeHtml(order.street)}\n`;
		if (order.house) msg += `🏠 Будинок: ${escapeHtml(order.house)}\n`;
		if (order.department)
			msg += `📦 Відділення: ${escapeHtml(order.department)}\n`;
		if (order.post) msg += `🏤 Поштовий індекс: ${escapeHtml(order.post)}\n`;
		if (order.address) msg += `📍 Адреса: ${escapeHtml(order.address)}\n`;
		if (order.method)
			msg += `🚚 Спосіб доставки: ${escapeHtml(order.method)}\n`;
		if (order.payment) msg += `💳 Оплата: ${escapeHtml(order.payment)}\n`;
		if (order.comment) msg += `💬 Коментар: ${escapeHtml(order.comment)}\n`;
		if (order.call) msg += `📞 Телефонний дзвінок: ${escapeHtml(order.call)}\n`;
		msg += `\n`;

		// 3) Товари
		if (Array.isArray(order.items) && order.items.length > 0) {
			msg += `<b>🛒 Список товарів:</b>\n`;
			let orderTotal = 0;

			order.items.forEach((item, idx) => {
				const qty = Number(item?.qty) || 0;
				const price = Number(item?.discounted_price) || 0;
				const total = qty * price;
				orderTotal += total;

				msg += `\n${idx + 1}. <b>${escapeHtml(item?.text ?? "")}</b>`;
				if (item?.article)
					msg += `\n   🔖 Артикул: ${escapeHtml(item.article)}`;
				if (item?.description)
					msg += `\n   📝 Опис: ${escapeHtml(item.description)}`;
				if (qty) msg += `\n   📦 Кількість: ${qty}`;
				if (item?.wage) msg += `\n   ⚖️ Вага: ${escapeHtml(item.wage)}`;
				if (price) msg += `\n   💲 Ціна: ${price.toFixed(2)} грн`;
				if (qty && price)
					msg += `\n   💰 Разом: <b>${total.toFixed(2)} грн</b>`;
				msg += `\n`;
			});

			if (orderTotal > 0) {
				msg += `\n<b>🔢 Підсумок: ${orderTotal.toFixed(2)} грн</b>\n`;
			}
		} else {
			msg += `❌ Товари не вказані\n`;
		}

		// 4) Надсилання у Telegram (з урахуванням 4096)
		await chunkAndSend(env("TELEGRAM_CHAT_ID"), msg);

		// 5) Оновлення sales_report як у поштовому варіанті
		if (Array.isArray(order.items)) {
			for (const item of order.items) {
				const { id, qty } = item || {};
				const qtyNum = Number(qty);
				if (!id || Number.isNaN(qtyNum)) continue;

				await FillersCollection.findByIdAndUpdate(
					id,
					{ $inc: { sales_report: qtyNum } },
					{ new: true }
				);
			}
		}
	} catch (error) {
		console.error("❌ Помилка при обробці замовлення:", error);
		throw error;
	}
};
