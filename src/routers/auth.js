import express from "express";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";
import {
	confirmOAuthSchema,
	loginUserSchema,
	registerUserSchema,
	requestResetEmailSchema,
	resetPasswordSchema,
	updateUserSchema,
} from "../validation/auth.js";
import {
	loginUserController,
	logoutUserController,
	refreshUserSessionController,
	registerUserController,
	resetPasswordController,
	updateUserController,
	getOAuthURLController,
	confirmOAuthController,
} from "../controllers/auth.js";
import { validateBody } from "../middlewares/validateBody.js";
import { requestResetEmailController } from "../controllers/contacts.js";
import { sendEmailController } from "../controllers/fillers.js";
import { authenticate } from "../middlewares/authenticate.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();
const jsonParser = express.json();

router.post(
	"/register",
	jsonParser,
	validateBody(registerUserSchema),
	ctrlWrapper(registerUserController)
);

router.post(
	"/login",
	validateBody(loginUserSchema),
	ctrlWrapper(loginUserController)
);

router.post("/logout", ctrlWrapper(logoutUserController));

router.post("/refresh", ctrlWrapper(refreshUserSessionController));

router.patch(
	"/update",
	authenticate,
	upload.single("avatar"),
	validateBody(updateUserSchema),
	ctrlWrapper(updateUserController)
);

router.post("/send-order", jsonParser, ctrlWrapper(sendEmailController));

router.post(
	"/send-reset-email",
	validateBody(requestResetEmailSchema),
	ctrlWrapper(requestResetEmailController)
);

router.post(
	"/reset-pwd",
	validateBody(resetPasswordSchema),
	ctrlWrapper(resetPasswordController)
);

router.get("/get-oauth-url", ctrlWrapper(getOAuthURLController));

router.post(
	"/confirm-oauth",
	jsonParser,
	validateBody(confirmOAuthSchema),
	ctrlWrapper(confirmOAuthController)
);

export default router;
