import express from "express";
import { upload } from "../middlewares/multer.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";
import {
	createCategoryController,
	getCategoryController,
	updateCategoryController,
} from "../controllers/category.js";
const router = express.Router();
const jsonParser = express.json();

router.get("/", ctrlWrapper(getCategoryController));

router.post("/", upload.single("icon"), ctrlWrapper(createCategoryController));

router.patch(
	"/update",
	upload.single("icon"),
	ctrlWrapper(updateCategoryController)
);

export default router;
