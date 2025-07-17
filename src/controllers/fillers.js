import createHttpError from "http-errors";
import {
	createFiller,
	createReply,
	createReview,
	deleteFiller,
	deleteReply,
	deleteReview,
	// getAllFillers,
	getFillerById,
	getFilteredFillers,
	getReviewsWithReplies,
	getTopSales,
	requestSendEmail,
	updateFiller,
} from "../services/fillers.js";

import { requestResetToken } from "../services/auth.js";
import { saveFileToUploadDir } from "../utils/saveFileToUploadDir.js";
import { saveFileToCloudinary } from "../utils/saveFileToCloudinary.js";
import { env } from "../utils/env.js";
import { UsersCollection } from "../db/models/user.js";
import mongoose from "mongoose";
const { Promise } = mongoose;

// export const getFillersController = async (req, res) => {
// 	const fillers = await getAllFillers();

// 	res.json({
// 		status: 200,
// 		message: "Successfully found filler!",
// 		data: fillers,
// 	});
// };

// export const getFillersController = async (req, res) => {
// 	const { type = "fillers", page = 1 } = req.query;

// 	const { fillers, total } = await getFilteredFillers(type, parseInt(page, 10));

// 	res.json({
// 		status: 200,
// 		message: "Successfully found filtered fillers!",
// 		data: fillers,
// 		total,
// 	});
// };

export const getFillersController = async (req, res) => {
	console.log("Запит", req.query);
	const {
		type_goods,
		page = 1,
		type,
		wage,
		features,
		minPrice,
		maxPrice,
		sort,
		firstPageLimit,
		nextPageLimit,
		onlyReviewed,
	} = req.query;

	const { fillers, total, stats } = await getFilteredFillers(
		type_goods,
		parseInt(page, 10),
		{
			type,
			wage,
			features,
			minPrice,
			maxPrice,
			sort,
			firstPageLimit: Number(firstPageLimit),
			nextPageLimit: Number(nextPageLimit),
			onlyReviewed: onlyReviewed === "true",
		}
	);

	res.json({
		status: 200,
		message: "Successfully fetched fillers!",
		data: fillers,
		total,
		filters: {
			type: stats.type.map((el) => ({ name: el._id, count: el.count })),
			wage: stats.wage.map((el) => ({ name: el._id, count: el.count })),
			features: stats.features.map((el) => ({ name: el._id, count: el.count })),
			priceRange: stats.priceRange[0] || { min: 0, max: 0 },
		},
	});
};

export const createReviewController = async (req, res) => {
	// console.log("DataRewiews", req.body);
	const { email, ...reviewData } = req.body;
	console.log("RequestReviews", req.body);

	// Перевіряємо, чи передано email
	if (!email) {
		throw createHttpError(400, "Email is required");
	}

	// Шукаємо користувача за email
	const user = await UsersCollection.findOne({ email });
	if (!user) {
		throw createHttpError(404, "User with this email does not exist");
	}

	// Якщо користувач існує — створюємо відгук
	const newReview = await createReview(reviewData);

	if (!newReview) {
		throw createHttpError(400, "Failed to create review");
	}

	res.status(201).json({
		status: 201,
		message: "Review successfully created",
		data: newReview,
	});
};

export const getReviewsByOwnerController = async (req, res) => {
	const { id_owner } = req.params;

	const reviews = await getReviewsWithReplies(id_owner);

	res.status(200).json({
		status: 200,
		data: reviews,
	});
};

export const createReplyController = async (req, res) => {
	const { reviewId } = req.params;
	const { parentReplyId, author, comment, email, id_owner, avatar } = req.body;

	if (!email) {
		throw createHttpError(400, "Email is required");
	}

	// Перевірка існування користувача
	const user = await UsersCollection.findOne({ email });
	if (!user) {
		throw createHttpError(404, "User with this email does not exist");
	}

	// Створення відповіді
	const newReply = await createReply({
		id_owner,
		reviewId,
		parentReplyId,
		author,
		comment,
		avatar,
	});

	if (!newReply) {
		throw createHttpError(400, "Failed to create reply");
	}

	res.status(201).json({
		status: 201,
		message: "Reply successfully created",
		data: newReply,
	});
};

export const deleteReviewController = async (req, res) => {
	const { reviewId } = req.params;

	const deletedReview = await deleteReview(reviewId);

	if (!deletedReview) {
		throw createHttpError(404, "Review not found or already deleted");
	}

	res.status(200).json({
		status: 200,
		message: `Review with id ${reviewId} successfully deleted`,
		data: deletedReview,
	});
};

export const deleteReplyByIdController = async (req, res) => {
	const { reviewId, replyId } = req.params;

	const deletedReply = await deleteReply(replyId, reviewId);

	if (!deletedReply) {
		throw createHttpError(404, "Reply not found or already deleted");
	}

	res.status(200).json({
		status: 200,
		message: `Reply with id ${replyId} successfully deleted`,
		data: deletedReply,
	});
};

export const getFillerByIdController = async (req, res) => {
	console.log("REQUESTID", req.body);
	const { fillerId } = req.params;
	const filler = await getFillerById(fillerId, req.user.id);

	if (!filler) {
		throw createHttpError(404, "Filler not found");
	}

	res.json({
		status: 200,
		message: `Successfully found filler with id ${fillerId}!`,
		data: filler,
	});
};

// export const createFillerController = async (req, res) => {
// 	const photo = req.file;
// 	let photoUrl;

// 	if (photo) {
// 		if (env("ENABLE_CLOUDINARY") === "true") {
// 			photoUrl = await saveFileToCloudinary(photo);
// 		} else {
// 			photoUrl = await saveFileToUploadDir(photo);
// 		}
// 	}

// 	const filler = {
// 		img: req.body.img,
// 		article: req.body.article,
// 		stars: req.body.stars,
// 		text: req.body.text,
// 		description: req.body.description,
// 		price: req.body.price,
// 		reviews: req.body.reviews,
// 		wages: req.body.wages,
// 		description_title: req.body.description_title,
// 		description_text: req.body.description_text,
// 		benefits_title: req.body.benefits_title,
// 		benefits_text: req.body.benefits_text,
// 		Regulations_title: req.body.Regulations_title,
// 		Regulations_text: req.body.Regulations_text,
// 		type_goods: req.body.type_goods,
// 		brand: req.body.brand,
// 		view: req.body.view,
// 		wage: req.body.wage,
// 		type: req.body.type,
// 		features: req.body.features,
// 		volume: req.body.volume,
// 		country: req.body.country,

// 		userId: req.user.id,
// 		photo: photoUrl,
// 	};

// 	const result = await createFiller(filler);

// 	res.status(201).json({
// 		status: 201,
// 		message: "Successfully created a filler!",
// 		data: result,
// 	});
// };

export const createFillerAdminController = async (req, res) => {
	const files = req.files;
	let imageUrls = [];

	if (files && files.length > 0) {
		if (env("ENABLE_CLOUDINARY") === "true") {
			imageUrls = [];

			for (const file of files) {
				const url = await saveFileToCloudinary(file);
				imageUrls.push(url);
			}
		} else {
			imageUrls = await Promise.all(files.map(saveFileToUploadDir));
		}
	}

	const filler = {
		...req.body,
		img: imageUrls,
	};

	const result = await createFiller(filler);

	return res.status(201).json({
		status: 201,
		message: "Successfully created a filler!",
		data: result,
	});
};

export const deleteFillerController = async (req, res, next) => {
	const { id } = req.params;

	const filler = await deleteFiller(id);

	if (!filler) {
		next(createHttpError(404, `Filler not found`));
		return;
	}

	res.status(204).send();
};

export const upsertFillerController = async (req, res, next) => {
	const { fillerId } = req.params;

	const result = await updateFiller(fillerId, req.user.id, req.body, {
		upsert: true,
	});

	if (!result) {
		next(createHttpError(404, `Filler not found`));
		return;
	}

	const status = result.isNew ? 201 : 200;

	res.status(status).json({
		status,
		message: `Succsessfully upserted a filler!`,
		data: result.filler,
	});
};

export const patchFillerController = async (req, res, next) => {
	const { id } = req.params;
	console.log("ID", id);
	const photos = req.files;

	let photoUrls = [];

	if (photos && photos.length) {
		for (const photo of photos) {
			let url;
			if (env("ENABLE_CLOUDINARY") === "true") {
				url = await saveFileToCloudinary(photo);
			} else {
				url = await saveFileToUploadDir(photo);
			}
			photoUrls.push(url);
		}
	}

	// if (photo) {
	//   photoUrl = await saveFileToUploadDir(photo);
	// }

	// const result = await updateContact(contactId, req.user.id, req.body);
	const result = await updateFiller(id, {
		...req.body,
		photo: photoUrls,
	});

	if (!result) {
		next(createHttpError(404, `Filler not found`));
		return;
	}

	res.json({
		status: 200,
		message: `Succsessfully patched a filler!`,
		data: result.filler,
	});
};

export const requestResetEmailController = async (req, res) => {
	await requestResetToken(req.body.email);
	res.json({
		message: "Reset password email was successfully sent!",
		status: 200,
		data: {},
	});
};

export const getTopSalesController = async (req, res) => {
	const page = parseInt(req.query.page, 20) || 1;

	const firstPageLimit = 2;
	const nextPageLimit = 2;

	const isFirstPage = page === 1;
	const limit = isFirstPage ? firstPageLimit : nextPageLimit;
	const skip = isFirstPage ? 0 : firstPageLimit + (page - 2) * nextPageLimit;

	const { data, total } = await getTopSales({ skip, limit });

	res.json({
		status: 200,
		message: "Successfully fetched top-selling fillers!",
		data,
		total,
	});
};

export const sendEmailController = async (req, res) => {
	console.log(req.body);
	await requestSendEmail(req.body); // передаємо весь об'єкт
	res.json({
		message: "Order was successfully sent to email!",
		status: 200,
		data: {},
	});
};
