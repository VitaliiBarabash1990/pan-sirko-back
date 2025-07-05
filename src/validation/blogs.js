import Joi from "joi";

// Schema for creating a filler
export const createBlogsSchema = Joi.object({
	img: Joi.string().required(),
	question: Joi.string().required(),
	answer: Joi.string().required(),
	date: Joi.string().required(),
});
