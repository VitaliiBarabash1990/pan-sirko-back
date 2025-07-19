import express from "express";
import contactsRouter from "./contacts.js";
import fillersRouter from "./fillers.js";
import authRouter from "./auth.js";
import novaposhta from "./novaposhta.js";
import blogsRouter from "./blogs.js";
import categoryRouter from "./category.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();

router.use("/fillers", fillersRouter);

router.use("/contacts", authenticate, contactsRouter);

router.use("/auth", authRouter);

router.use("/novaposhta", novaposhta);

router.use("/blogs", blogsRouter);

router.use("/category", categoryRouter);

export default router;
