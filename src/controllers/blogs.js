import createHttpError from "http-errors";
import {
	createArticle,
	getArticleById,
	getPaginatedBlogs,
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
