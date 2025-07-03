import Joi from "joi";

export const registerUserSchema = Joi.object({
	name: Joi.string().min(3).max(30).required(),
	second_name: Joi.string().min(3).max(30).required(false),
	phone: Joi.string()
		.pattern(/^\+380\d{9}$/)
		.required()
		.messages({
			"string.pattern.base": `Phone number must be in format +380XXXXXXXXX`,
		}),
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

export const loginUserSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

export const requestResetEmailSchema = Joi.object({
	email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
	password: Joi.string().required(),
	token: Joi.string().required(),
});
