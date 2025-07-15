// import { Router } from 'express';
import express from "express";
import {
	createArticleController,
	deleteArticleController,
	getArticleByIdController,
	// deleteReviewController,
	getBlogsController,
	updateBlogController,
	// getReviewsByOwnerController,
} from "../controllers/blogs.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";
// import { isValidId } from "../middlewares/isValidId.js";
import { upload } from "../middlewares/multer.js";
import { authenticate } from "../middlewares/authenticate.js";
import { isValidId } from "../middlewares/isValidId.js";

const router = express.Router();
// const jsonParser = express.json();

router.get("/", ctrlWrapper(getBlogsController));

router.get("/articles/:id", isValidId, ctrlWrapper(getArticleByIdController));

router.post(
	"/articles",
	// authenticate,
	upload.single("img"),
	ctrlWrapper(createArticleController)
);

router.patch("/:id", upload.single("img"), ctrlWrapper(updateBlogController));

router.delete("/:id", isValidId, ctrlWrapper(deleteArticleController));

export default router;
