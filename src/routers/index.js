import express from "express";
import contactsRouter from "./contacts.js";
import fillersRouter from "./fillers.js";
import authRouter from "./auth.js";
import novaposhta from "./novaposhta.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();

router.use("/fillers", fillersRouter);

router.use("/contacts", authenticate, contactsRouter);

router.use("/auth", authRouter);

router.use("/novaposhta", novaposhta);

export default router;
