// import { Router } from 'express';
import express from "express";
import {
	createFillerController,
	createReplyController,
	createReviewController,
	deleteFillerController,
	deleteReplyByIdController,
	deleteReviewController,
	getFillerByIdController,
	getFillersController,
	getReviewsByOwnerController,
	getTopSalesController,
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
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();
const jsonParser = express.json();

router.get("/", ctrlWrapper(getFillersController));

router.post("/reviews", ctrlWrapper(createReviewController));

router.get("/reviews/:id_owner", ctrlWrapper(getReviewsByOwnerController));

router.post("/reviews/:reviewId/replies", ctrlWrapper(createReplyController));

router.delete("/reviews/:reviewId", ctrlWrapper(deleteReviewController));

router.delete(
	"/reviews/:reviewId/replies/:replyId",
	ctrlWrapper(deleteReplyByIdController)
);

router.get("/top-sales", ctrlWrapper(getTopSalesController));

router.get("/:fillerId", isValidId, ctrlWrapper(getFillerByIdController));

router.post(
	"/",
	authenticate,
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
