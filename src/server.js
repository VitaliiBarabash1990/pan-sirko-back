import express from "express";
import pino from "pino-http";
import cors from "cors";

// import contactsRouter from './routers/contacts.js';
import router from "./routers/index.js";

import { env } from "./utils/env.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import { UPLOAD_DIR } from "./constants/index.js";

const PORT = Number(env("PORT", "3000"));

const setupServer = () => {
	const app = express();

	app.use(express.json());
	// app.use(cors());

	const allowedOrigins = [
		"http://localhost:3001",
		"http://45.154.116.149",
		"http://pan-sirko.com.ua",
		"https://pan-sirko.com.ua",
		"http://www.pan-sirko.com.ua",
		"https://www.pan-sirko.com.ua",
		"https://pan-sirko.vercel.app",
	];

	app.use(
		cors({
			origin: (origin, callback) => {
				// дозволити без origin (Postman, сервер-сервер) або зі списку
				if (
					!origin ||
					allowedOrigins.some((allowed) => origin.startsWith(allowed))
				) {
					callback(null, true);
				} else {
					callback(new Error("Not allowed by CORS"));
				}
			},
			credentials: true, // дозволяємо передавати куки/заголовки авторизації
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
		})
	);

	// Обробка preflight-запитів (OPTIONS)
	app.options("*", cors());

	app.use(cookieParser());

	app.use(
		pino({
			transport: {
				target: "pino-pretty",
			},
		})
	);

	app.get("/", (req, res) => {
		res.json({
			message: "Hello world!",
		});
	});

	app.use("/uploads", express.static(UPLOAD_DIR));

	// app.use(contactsRouter);

	app.use(router);

	app.use("*", notFoundHandler);

	app.use(errorHandler);

	app.listen(PORT, () => {
		console.log(`Server is running on port ${PORT}`);
	});
};

export default setupServer;
