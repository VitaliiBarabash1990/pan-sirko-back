import express from "express";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";
import {
	loginUserSchema,
	registerUserSchema,
	requestResetEmailSchema,
	resetPasswordSchema,
} from "../validation/auth.js";
import {
	loginUserController,
	logoutUserController,
	refreshUserSessionController,
	registerUserController,
	resetPasswordController,
} from "../controllers/auth.js";
import { validateBody } from "../middlewares/validateBody.js";
import { requestResetEmailController } from "../controllers/contacts.js";
import { sendEmailController } from "../controllers/fillers.js";

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

export default router;
