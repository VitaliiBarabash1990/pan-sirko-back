import Joi from "joi";

const allowedTypes = ["toys", "houses", "fillers"];
const allowedTypesForType = [
	"Бентонітовий",
	"Соєво-кукурудзяний",
	"Кукурудзяний",
	"Будиночок",
	"Лежак",
	"Матрац",
];

// Schema for creating a filler
// export const createFillerSchema = Joi.object({
// 	img: Joi.string().required(),
// 	article: Joi.string().optional(),
// 	stars: Joi.number().integer().min(0).max(5).required(),
// 	text: Joi.string().required(),
// 	description: Joi.string().required(),
// 	price: Joi.number().positive().required(),
// 	reviews: Joi.number().integer().min(0).required(),
// 	wages: Joi.array().items(Joi.string()).required(),
// 	description_title: Joi.string().required(),
// 	description_text: Joi.string().required(),
// 	benefits_title: Joi.string().required(),
// 	benefits_text: Joi.array().items(Joi.string()).required(),
// 	Regulations_title: Joi.string().required(),
// 	Regulations_text: Joi.array().items(Joi.string()).required(),
// 	sales_report: Joi.number().positive().required(),
// 	brand: Joi.string().required(),
// 	view: Joi.string().required(),
// 	wage: Joi.number().positive().required(),
// 	type: Joi.string()
// 		.valid(...allowedTypesForType)
// 		.default("Бентонітовий")
// 		.optional(),
// 	features: Joi.string()
// 		.valid("З ароматом", "Без аромату")
// 		.default("З ароматом")
// 		.optional(),
// 	volume: Joi.number().positive().required(),
// 	country: Joi.string().required(),
// 	qty: Joi.string().optional(),
// 	type_goods: Joi.string()
// 		.valid(...allowedTypes)
// 		.default("fillers"),
// 	isSale: Joi.boolean().optional(),
// 	status: Joi.boolean().optional(),
// });

export const createFillerAdminSchema = Joi.object({
	text: Joi.string().optional(),
	description: Joi.string().optional(),
	brand: Joi.string().optional(),
	wage: Joi.number().min(0).optional(),
	features: Joi.string()
		.valid("З ароматом", "Без аромату")
		.default("З ароматом")
		.optional(),
	type: Joi.string().optional(),
	volume: Joi.number().min(0).optional(),
	country: Joi.string().optional(),
	type_goods: Joi.string().optional(),
	price: Joi.number().min(0).optional(),
	discounted_price: Joi.number().min(0).optional(),
	availability: Joi.boolean().truthy("true").falsy("false").default(true),
	article: Joi.string().optional(),
	stars: Joi.number().integer().min(0).max(5).optional(),
	reviews: Joi.number().integer().min(0).optional(),
	// wages: Joi.array().items(Joi.string()).optional(),
	// description_title: Joi.string().optional(),
	// description_text: Joi.string().optional(),
	// benefits_title: Joi.string().optional(),
	// benefits_text: Joi.array().items(Joi.string()).optional(),
	// Regulations_title: Joi.string().optional(),
	// Regulations_text: Joi.array().items(Joi.string()).optional(),
	sales_report: Joi.number().positive().optional(),
	view: Joi.string().optional(),
	qty: Joi.string().optional(),
	isSale: Joi.boolean().optional(),
	status: Joi.boolean().optional(),
});

// Schema for updating a filler (all fields optional, just validation)

export const updateFillerSchema = Joi.object({
	img: Joi.string(),
	imgsvg: Joi.string(),
	stars: Joi.number().integer().min(0).max(5),
	text: Joi.string(),
	description: Joi.string(),
	price: Joi.number().positive(),
	reviews: Joi.number().integer().min(0),
	wages: Joi.array().items(Joi.string()),
	description_title: Joi.string(),
	description_text: Joi.string(),
	benefits_title: Joi.string(),
	benefits_text: Joi.array().items(Joi.string()),
	Regulations_title: Joi.string(),
	Regulations_text: Joi.array().items(Joi.string()),
	brand: Joi.string(),
	view: Joi.string(),
	wage: Joi.number().positive(),
	volume: Joi.number().positive(),
	country: Joi.string(),
});

export const updateFillerAdminSchema = Joi.object({
	text: Joi.string().optional(),
	description: Joi.string().optional(),
	brand: Joi.string().optional(),
	wage: Joi.number().min(0).optional(),
	features: Joi.string()
		.valid("З ароматом", "Без аромату")
		.default("З ароматом")
		.optional(),
	type: Joi.string().optional(),
	volume: Joi.number().min(0).optional(),
	country: Joi.string().optional(),
	type_goods: Joi.string().optional(),
	price: Joi.number().min(0).optional(),
	discounted_price: Joi.number().min(0).optional(),
	availability: Joi.boolean().truthy("true").falsy("false").default(true),
	article: Joi.string().optional(),
	stars: Joi.number().integer().min(0).max(5).optional(),
	reviews: Joi.number().integer().min(0).optional(),
	// wages: Joi.array().items(Joi.string()).optional(),
	// description_title: Joi.string().optional(),
	// description_text: Joi.string().optional(),
	// benefits_title: Joi.string().optional(),
	// benefits_text: Joi.array().items(Joi.string()).optional(),
	// Regulations_title: Joi.string().optional(),
	// Regulations_text: Joi.array().items(Joi.string()).optional(),
	sales_report: Joi.number().positive().optional(),
	view: Joi.string().optional(),
	qty: Joi.string().optional(),
	isSale: Joi.boolean().optional(),
	status: Joi.boolean().optional(),
});
