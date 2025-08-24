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
	app.use(
		cors({
			origin: "https://pan-sirko.vercel.app",
			// origin: "http://localhost:3001",
			credentials: true, // ← дозволити куки
		})
	);
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
