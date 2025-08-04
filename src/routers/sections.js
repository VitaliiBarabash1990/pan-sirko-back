import express from "express";
import { upload } from "../middlewares/multer.js";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";
import {
	createSectionsController,
	getSectionsController,
	updateSectionsController,
} from "../controllers/sections.js";
const router = express.Router();
const jsonParser = express.json();

router.get("/", ctrlWrapper(getSectionsController));

router.post("/", upload.array("img", 3), ctrlWrapper(createSectionsController));

router.patch(
	"/update",
	upload.array("img[]"),
	ctrlWrapper(updateSectionsController)
);

export default router;
