// import { Router } from 'express';
import express from "express";
import {
	createFillerController,
	deleteFillerController,
	getFillerByIdController,
	getFillersController,
	patchFillerController,
	upsertFillerController,
} from "../controllers/fillers.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";
import {
	createFillerSchema,
	updateFillerSchema,
} from "../validation/fillers.js";
import { validateBody } from "../middlewares/validateBody.js";
import { isValidId } from "../middlewares/isValidId.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();
const jsonParser = express.json();

router.get("/", ctrlWrapper(getFillersController));

router.get("/:fillerId", isValidId, ctrlWrapper(getFillerByIdController));

router.post(
	"/",
	// upload.single("photo"),
	jsonParser,
	validateBody(createFillerSchema),
	ctrlWrapper(createFillerController)
);

// router.post(
// 	"/register",
// 	validateBody(createContactSchema),
// 	ctrlWrapper(createContactController)
// );

router.delete("/:fillerId", isValidId, ctrlWrapper(deleteFillerController));

router.put(
	"/:fillerId",
	isValidId,
	upload.single("photo"),
	validateBody(createFillerSchema),
	ctrlWrapper(upsertFillerController)
);

router.patch(
	"/:fillerId",
	isValidId,
	upload.single("photo"),
	validateBody(updateFillerSchema),
	ctrlWrapper(patchFillerController)
);

export default router;
