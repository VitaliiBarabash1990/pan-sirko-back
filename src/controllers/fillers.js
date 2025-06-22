import createHttpError from "http-errors";
import {
	createFiller,
	deleteFiller,
	getAllFillers,
	getFillerById,
	requestSendEmail,
	updateFiller,
} from "../services/fillers.js";

import { requestResetToken } from "../services/auth.js";
import { saveFileToUploadDir } from "../utils/saveFileToUploadDir.js";
import { saveFileToCloudinary } from "../utils/saveFileToCloudinary.js";
import { env } from "../utils/env.js";

export const getFillersController = async (req, res) => {
	const fillers = await getAllFillers();

	res.json({
		status: 200,
		message: "Successfully found filler!",
		data: fillers,
	});
};

export const getFillerByIdController = async (req, res) => {
	const { fillerId } = req.params;
	const filler = await getFillerById(fillerId, req.user.id);

	if (!filler) {
		throw createHttpError(404, "Filler not found");
	}

	// //Якщо використовуємо цю умову то в services використовуємо 56 рядок, а якщо використовуємо getContactById 61 рядок то цю умову не використовуємо
	// if (contact.userId.toString() !== req.user.id.toString()) {
	//   // throw new createHttpError.Forbidden('Contacts forbidden!')//Академічно потрібно цей рядок але використовують
	//   throw new createHttpError.NotFound('Contact not found'); //Щоб заплутати небажаного користувача
	// }

	res.json({
		status: 200,
		message: `Successfully found filler with id ${fillerId}!`,
		data: filler,
	});
};

export const createFillerController = async (req, res) => {
	const photo = req.file;
	let photoUrl;

	if (photo) {
		if (env("ENABLE_CLOUDINARY") === "true") {
			photoUrl = await saveFileToCloudinary(photo);
		} else {
			photoUrl = await saveFileToUploadDir(photo);
		}
	}

	const filler = {
		img: req.body.img,
		article: req.body.article,
		stars: req.body.stars,
		text: req.body.text,
		description: req.body.description,
		price: req.body.price,
		reviews: req.body.reviews,
		wages: req.body.wages,
		description_title: req.body.description_title,
		description_text: req.body.description_text,
		benefits_title: req.body.benefits_title,
		benefits_text: req.body.benefits_text,
		Regulations_title: req.body.Regulations_title,
		Regulations_text: req.body.Regulations_text,
		brand: req.body.brand,
		view: req.body.view,
		wage: req.body.wage,
		volume: req.body.volume,
		country: req.body.country,

		userId: req.user.id,
		photo: photoUrl,
	};

	const result = await createFiller(filler);

	res.status(201).json({
		status: 201,
		message: "Successfully created a filler!",
		data: result,
	});
};

export const deleteFillerController = async (req, res, next) => {
	const { fillerId } = req.params;

	const filler = await deleteFiller(fillerId, req.user.id);

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
	const { fillerId } = req.params;
	const photo = req.file;

	let photoUrl;

	if (photo) {
		if (env("ENABLE_CLOUDINARY") === "true") {
			photoUrl = await saveFileToCloudinary(photo);
		} else {
			photoUrl = await saveFileToUploadDir(photo);
		}
	}

	// if (photo) {
	//   photoUrl = await saveFileToUploadDir(photo);
	// }

	// const result = await updateContact(contactId, req.user.id, req.body);
	const result = await updateFiller(fillerId, req.user.id, {
		...req.body,
		photo: photoUrl,
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

export const sendEmailController = async (req, res) => {
	console.log(req.body);
	await requestSendEmail(req.body); // передаємо весь об'єкт
	res.json({
		message: "Order was successfully sent to email!",
		status: 200,
		data: {},
	});
};
