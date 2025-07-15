import createHttpError from "http-errors";
import {
	createArticle,
	deleteArticle,
	getArticleById,
	getPaginatedBlogs,
	updateBlogById,
} from "../services/blogs.js";

import { saveFileToCloudinary } from "../utils/saveFileToCloudinary.js";

export const getBlogsController = async (req, res) => {
	const { page = 1, search = "" } = req.query;

	const { blogs, total } = await getPaginatedBlogs(Number(page), search);

	res.json({
		status: 200,
		message: "Successfully fetched blogs!",
		data: blogs,
		total,
	});
};

export const getArticleByIdController = async (req, res) => {
	const { id } = req.params;

	const article = await getArticleById(id);

	if (!article) {
		throw createHttpError(404, "Article not found");
	}

	res.status(200).json({
		status: 200,
		message: "Article found",
		data: article,
	});
};

export const createArticleController = async (req, res) => {
	const { question, answer } = req.body;
	const imgFile = req.file;

	if (!question || !answer) {
		throw createHttpError(400, "Question and answer are required");
	}

	let imgUrl;

	if (imgFile) {
		imgUrl = await saveFileToCloudinary(imgFile);
	}

	const newArticle = await createArticle({
		question,
		answer,
		img: imgUrl || null,
	});

	res.status(201).json({
		status: 201,
		message: "Article successfully created",
		data: newArticle,
	});
};

export const updateBlogController = async (req, res) => {
	const { id } = req.params;
	const { question, answer } = req.body;
	const file = req.file; // якщо використовуєш multer для `multipart/form-data`

	const updateData = {};
	if (question !== undefined) updateData.question = question;
	if (answer !== undefined) updateData.answer = answer;
	if (file) {
		// Завантаження зображення в Cloudinary
		const imgUrl = await saveFileToCloudinary(file);
		updateData.img = imgUrl;
	}

	const updatedBlog = await updateBlogById(id, updateData);

	if (!updatedBlog) {
		return res.status(404).json({ status: 404, message: "Blog not found" });
	}

	res.json({
		status: 200,
		message: "Blog updated successfully!",
		data: updatedBlog,
	});
};

export const deleteArticleController = async (req, res, next) => {
	const { id } = req.params;

	const filler = await deleteArticle(id);

	if (!filler) {
		next(createHttpError(404, `Filler not found`));
		return;
	}

	res.status(204).send();
};
