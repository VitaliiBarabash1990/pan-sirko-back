import { FillersCollection } from "../db/models/fillers.js";
import { sendEmail } from "../utils/sendMail.js";
import handlebars from "handlebars";
import path from "node:path";
import { TEMPLATES_DIR } from "../constants/index.js";
import fs from "node:fs/promises";
import { env } from "../utils/env.js";
import { BlogsCollection } from "../db/models/blogs.js";
import { reply } from "../db/models/reply.js";

export const getPaginatedBlogs = async (page = 1, search = "") => {
	const limit = 10;
	const skip = (page - 1) * limit;

	const filter = {};
	if (search.trim()) {
		filter.question = { $regex: search.trim(), $options: "i" }; // пошук без регістру
	}

	const [blogs, total] = await Promise.all([
		BlogsCollection.find(filter)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit),
		BlogsCollection.countDocuments(filter),
	]);

	return { blogs, total };
};

export const getArticleById = async (id) => {
	return await BlogsCollection.findById(id);
};

export const createArticle = async (data) => {
	return await BlogsCollection.create(data);
};
