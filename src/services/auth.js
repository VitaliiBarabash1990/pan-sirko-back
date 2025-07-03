import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import { UsersCollection } from "../db/models/user.js";

import {
	FIFTEEN_MINUTES,
	ONE_DAY,
	SMTP,
	TEMPLATES_DIR,
} from "../constants/index.js";
import { SessionsCollection } from "../db/models/session.js";
import { sendEmail } from "../utils/sendMail.js";

import jwt from "jsonwebtoken";
import { env } from "../utils/env.js";

import handlebars from "handlebars";
import path from "node:path";
import fs from "node:fs/promises";

// export const registerUser = async (payload) => {
//   const user = await UsersCollection.findOne({ email: payload.email });

//   if (user !== null) {
//     throw createHttpError(409, 'Email already in use');
//   }

//   return await UsersCollection.create(payload);
// };

// export const registerUser = async (payload) => {
// 	const user = await UsersCollection.findOne({ phone: payload.phone });
// 	if (user) throw createHttpError(409, "Phone in use");

// 	const encryptedPassword = await bcrypt.hash(payload.password, 10);
// 	return await UsersCollection.create({
// 		...payload,
// 		password: encryptedPassword,
// 	});
// };

// export const registerUser = async (payload) => {
// 	try {
// 		const existing = await UsersCollection.findOne({ phone: payload.phone });
// 		if (existing) throw createHttpError(409, "Phone in use");

// 		const encryptedPassword = await bcrypt.hash(payload.password, 10);

// 		const created = await UsersCollection.create({
// 			...payload,
// 			password: encryptedPassword,
// 		});

// 		console.log("User created:", created);
// 		return created;
// 	} catch (err) {
// 		console.error("Error in registerUser:", err);
// 		throw err;
// 	}
// };

export const registerUser = async (payload) => {
	try {
		const existing = await UsersCollection.findOne({ email: payload.email });
		if (existing) throw createHttpError(409, "Email in use");

		const encryptedPassword = await bcrypt.hash(payload.password, 10);

		const createdUser = await UsersCollection.create({
			...payload,
			password: encryptedPassword,
		});

		console.log("User created:", createdUser);

		const accessToken = randomBytes(30).toString("base64");
		const refreshToken = randomBytes(30).toString("base64");

		const session = await SessionsCollection.create({
			userId: createdUser._id,
			accessToken,
			refreshToken,
			accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
			refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
		});

		const result = {
			name: createdUser.name,
			second_name: createdUser.name,
			phone: createdUser.phone,
			email: createdUser.email,
			accessToken: session.accessToken,
			userId: session.userId,
		};

		return result;
	} catch (err) {
		console.error("Error in registerUser:", err);
		throw err;
	}
};

export const loginUser = async (payload) => {
	const user = await UsersCollection.findOne({
		email: payload.email,
	});
	if (!user) {
		throw createHttpError(404, "User not found");
	}
	const isEqual = await bcrypt.compare(payload.password, user.password);

	if (!isEqual) {
		throw createHttpError(401, "Unauthorized");
	}

	await SessionsCollection.deleteOne({ userId: user._id });

	const accessToken = randomBytes(30).toString("base64");
	const refreshToken = randomBytes(30).toString("base64");

	const createdSession = await SessionsCollection.create({
		userId: user._id,
		accessToken,
		refreshToken,
		accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
		refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
	});

	const result = {
		name: user.name,
		second_name: user.second_name,
		phone: user.phone,
		email: user.email,
		accessToken: createdSession.accessToken,
		userId: createdSession.userId,
	};
	return result;
};

export const logoutUser = async (sessionId) => {
	await SessionsCollection.deleteOne({ _id: sessionId });
};

const createSession = () => {
	const accessToken = randomBytes(30).toString("base64");
	const refreshToken = randomBytes(30).toString("base64");

	return {
		accessToken,
		refreshToken,
		accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
		refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
	};
};

export const refreshUsersSession = async ({ sessionId, refreshToken }) => {
	const session = await SessionsCollection.findOne({
		_id: sessionId,
		refreshToken,
	});

	if (!session) {
		throw createHttpError(401, "Session not found");
	}

	const isSessionTokenExpired =
		new Date() > new Date(session.refreshTokenValidUntil);

	if (isSessionTokenExpired) {
		throw createHttpError(401, "Session token expired");
	}

	const newSession = createSession();

	await SessionsCollection.deleteOne({ _id: sessionId, refreshToken });

	return await SessionsCollection.create({
		userId: session.userId,
		...newSession,
	});
};

// export const requestResetToken = async (email) => {
//   const user = await UsersCollection.findOne({ email });
//   if (!user) {
//     throw createHttpError(404, 'User not found');
//   }
//   const resetToken = jwt.sign(
//     {
//       sub: user._id,
//       email,
//     },
//     env('JWT_SECRET'),
//     {
//       expiresIn: '150m',
//     },
//   );

//   await sendEmail({
//     from: env(SMTP.SMTP_FROM),
//     to: email,
//     subject: 'Reset your password',
//     html: `<p>Click <a href="${resetToken}">here</a> to reset your password!</p>`,
//   });
// };

export const requestResetToken = async (email) => {
	const user = await UsersCollection.findOne({ email });
	if (!user) {
		throw createHttpError(404, "User not found");
	}
	const resetToken = jwt.sign(
		{
			sub: user._id,
			email,
		},
		env("JWT_SECRET"),
		{
			expiresIn: "15m",
		}
	);

	const resetPasswordTemplatePath = path.join(
		TEMPLATES_DIR,
		"reset-password-email.html"
	);

	const templateSource = (
		await fs.readFile(resetPasswordTemplatePath)
	).toString();

	const template = handlebars.compile(templateSource);
	const html = template({
		name: user.name,
		link: `${env("APP_DOMAIN")}/reset-pasword?token=${resetToken}`,
	});

	await sendEmail({
		from: env(SMTP.SMTP_FROM),
		to: email,
		subject: "Reset your password",
		html,
	});
};

export const resetPassword = async (payload) => {
	let entries;

	try {
		entries = jwt.verify(payload.token, env("JWT_SECRET"));
	} catch (err) {
		if (err instanceof Error) throw createHttpError(401, err.message);
		throw err;
	}

	const user = await UsersCollection.findOne({
		email: entries.email,
		_id: entries.sub,
	});

	if (!user) {
		throw createHttpError(404, "User not found");
	}

	const encryptedPassword = await bcrypt.hash(payload.password, 10);

	await UsersCollection.updateOne(
		{
			_id: user._id,
		},
		{ password: encryptedPassword }
	);
};
