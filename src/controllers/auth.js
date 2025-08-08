import {
	loginUser,
	logoutUser,
	refreshUsersSession,
	registerUser,
	resetPassword,
	updateUser,
	loginOrRegister,
	adminLoginService,
} from "../services/auth.js";
import { generateOAuthURL, validateCode } from "../utils/googleOAuth2.js";
import { ONE_DAY } from "../constants/index.js";
import { env } from "../utils/env.js";
import { saveFileToCloudinary } from "../utils/saveFileToCloudinary.js";
import { saveFileToUploadDir } from "../utils/saveFileToUploadDir.js";

export const registerUserController = async (req, res) => {
	const { user, session } = await registerUser(req.body);

	setupSession(res, session);

	res.status(201).json({
		status: 201,
		message: "Successfully registered a user!",
		data: user,
	});
};

export const loginUserController = async (req, res) => {
	const session = await loginUser(req.body);
	res.cookie("refreshToken", session.refreshToken.toString(), {
		httpOnly: true,
		expires: new Date(Date.now() + ONE_DAY),
		sameSite: "none",
		secure: true,
		// sameSite: "Lax",
		// secure: false,
	});
	res.cookie("sessionId", session._id.toString(), {
		httpOnly: true,
		expires: new Date(Date.now() + ONE_DAY),
		sameSite: "none",
		secure: true,
		// sameSite: "Lax",
		// secure: false,
	});

	res.json({
		status: 200,
		message: "Successfully logged in an user!",
		data: {
			data: session,
		},
	});
};

export const adminLoginController = async (req, res) => {
	const session = await adminLoginService(req.body);

	res.cookie("refreshToken", session.refreshToken.toString(), {
		httpOnly: true,
		expires: new Date(Date.now() + ONE_DAY),
		sameSite: "none",
		secure: true,
		// sameSite: "Lax",
		// secure: false,
	});
	res.cookie("sessionId", session._id.toString(), {
		httpOnly: true,
		expires: new Date(Date.now() + ONE_DAY),
		sameSite: "none",
		secure: true,
		// sameSite: "Lax",
		// secure: false,
	});

	res.json({
		status: 200,
		message: "Successfully logged in an admin!",
		data: { data: session },
	});
};

export const logoutUserController = async (req, res) => {
	if (req.cookies.sessionId) {
		await logoutUser(req.cookies.sessionId);
	}
	res.clearCookie("sessionId");
	res.clearCookie("refreshToken");

	res.status(204).send();
};

const setupSession = (res, session) => {
	res.cookie("refreshToken", session.refreshToken.toString(), {
		httpOnly: true,
		expires: new Date(Date.now() + ONE_DAY),
		sameSite: "none",
		secure: true,
		// sameSite: "lax",
		// secure: false,
	});
	res.cookie("sessionId", session._id.toString(), {
		httpOnly: true,
		expires: new Date(Date.now() + ONE_DAY),
		sameSite: "none",
		secure: true,
		// sameSite: "lax",
		// secure: false,
	});
};

export const refreshUserSessionController = async (req, res) => {
	const session = await refreshUsersSession({
		sessionId: req.cookies.sessionId,
		refreshToken: req.cookies.refreshToken,
	});

	// console.log("Session from DB:", session._id.toString(), session.refreshToken);

	setupSession(res, session);
	// console.log("Cookies:", req.cookies);
	// console.log("sessionId:", req.cookies?.sessionId);

	res.json({
		status: 200,
		message: "Successfully refreshed a session!",
		data: {
			accessToken: session.accessToken,
		},
	});
};

export const resetPasswordController = async (req, res) => {
	await resetPassword(req.body);
	res.json({
		message: "Password was successfully reset!",
		status: 200,
		data: {},
	});
};

export const updateUserController = async (req, res) => {
	const user = req.user;
	const userId = user.id;
	const avatar = req.file;

	let avatarUrl;

	if (avatar) {
		if (env("ENABLE_CLOUDINARY") === "true") {
			avatarUrl = await saveFileToCloudinary(avatar);
		} else {
			avatarUrl = await saveFileToUploadDir(avatar);
		}
	}

	const updatedUser = await updateUser(userId, {
		...req.body,
		avatar: avatarUrl,
	});

	res.status(200).json({
		status: 200,
		message: "Successfully updated a user!",
		data: updatedUser,
	});
};

export async function getOAuthURLController(req, res) {
	const url = generateOAuthURL();

	res.send({
		status: 200,
		message: "Successfully get Google OAuth URL",
		data: url,
	});
}

export async function confirmOAuthController(req, res) {
	const { code } = req.body;
	// console.log("OAuth code:", code);

	console.log(code);
	const ticket = await validateCode(code);
	const session = await loginOrRegister(ticket.payload);

	setupSession(res, session);

	res.send({
		status: 200,
		message: "Login with Google seccessfuly",
		data: {
			name: session.name,
			second_name: session.second_name,
			phone: session.phone,
			email: session.email,
			avatar: session.avatar,
			accessToken: session.accessToken,
		},
	});
}
