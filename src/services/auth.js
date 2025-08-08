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
import mongoose from "mongoose";

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

		const termsBool = payload.terms === true || payload.terms === "true";

		const createdUser = await UsersCollection.create({
			...payload,
			password: encryptedPassword,
			consentGiven: termsBool,
			consentDate: termsBool ? new Date() : null,
			consentPolicyVersion: termsBool ? "1.0" : null,
		});

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
			second_name: createdUser.second_name,
			phone: createdUser.phone,
			email: createdUser.email,
			avatar: createdUser.avatar,
			// role: createdUser.role,
			accessToken: session.accessToken,
			userId: session.userId,
		};

		// return result;
		return { user: result, session };
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
		avatar: user.avatar,
		// role: user.role,
		accessToken: createdSession.accessToken,
		refreshToken: createdSession.refreshToken, // ← додай
		sessionId: createdSession._id, // ← додай
		userId: createdSession.userId,
		_id: createdSession._id,
	};
	return result;
};

export const adminLoginService = async (payload) => {
	const user = await UsersCollection.findOne({ email: payload.email });
	if (!user) throw createHttpError(404, "Admin not found");
	if (user.role !== "admin") throw createHttpError(403, "Forbidden");

	const isEqual = await bcrypt.compare(payload.password, user.password);
	if (!isEqual) throw createHttpError(401, "Unauthorized");

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

	return {
		name: user.name,
		second_name: user.second_name,
		phone: user.phone,
		email: user.email,
		avatar: user.avatar,
		role: user.role,
		accessToken: createdSession.accessToken,
		refreshToken: createdSession.refreshToken,
		sessionId: createdSession._id,
		userId: createdSession.userId,
		_id: createdSession._id,
	};
};

export const logoutUser = async (sessionId) => {
	await SessionsCollection.deleteOne({ _id: sessionId });
};

export const createSession = () => {
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

	// Генеруємо нові токени (функція повинна повертати об'єкт з токенами і датами)
	const {
		accessToken,
		refreshToken: newRefreshToken,
		accessTokenValidUntil,
		refreshTokenValidUntil,
	} = createSession();

	// Оновлюємо існуючу сесію
	session.accessToken = accessToken;
	session.refreshToken = newRefreshToken;
	session.accessTokenValidUntil = accessTokenValidUntil;
	session.refreshTokenValidUntil = refreshTokenValidUntil;

	await session.save();

	return session;
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
		link: `${env("APP_DOMAIN")}?token=${resetToken}`,
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

export const updateUser = async (userId, payload) => {
	const updatedUser = await UsersCollection.findOneAndUpdate(
		{ _id: userId },
		payload,
		{
			new: true,
		}
	);

	return updatedUser;
};

export async function loginOrRegister(payload) {
	const { email, name, picture } = payload;

	let user = await UsersCollection.findOne({ email });

	// Якщо користувача немає — створити
	if (!user) {
		const password = await bcrypt.hash(randomBytes(30).toString("base64"), 10);
		user = await UsersCollection.create({
			name,
			email,
			avatar: picture,
			password,
		});
	}

	// Видалити всі старі сесії цього користувача
	await SessionsCollection.deleteMany({ userId: user._id });

	// Створити токени
	const accessToken = randomBytes(30).toString("base64");
	const refreshToken = randomBytes(30).toString("base64");

	// Створити нову сесію
	const createdSession = await SessionsCollection.create({
		userId: user._id,
		accessToken,
		refreshToken,
		accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
		refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
	});

	// Повернути результат
	return {
		name: user.name,
		second_name: user.second_name || "",
		phone: user.phone || "",
		email: user.email,
		avatar: user.avatar,
		accessToken: createdSession.accessToken,
		refreshToken: createdSession.refreshToken,
		sessionId: createdSession._id,
		userId: user._id,
		_id: createdSession._id,
	};
}

// export async function loginOrRegister(payload) {
// 	const user = await UsersCollection.findOne({ email: payload.email });

// 	if (user === null) {
// 		const password = await bcrypt.hash(randomBytes(30).toString("base64"), 10);
// 		const createdUser = await UsersCollection.create({
// 			name: payload.name,
// 			email: payload.email,
// 			avatar: payload.picture,
// 			password,
// 		});

// 		return SessionsCollection.create({
// 			userId: createdUser._id,
// 			accessToken: randomBytes(30).toString("base64"),
// 			refreshToken: randomBytes(30).toString("base64"),
// 			accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
// 			refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
// 		});
// 	}
// 	await SessionsCollection.deleteOne({ userId: user._id });

// 	return SessionsCollection.create({
// 		userId: user._id,
// 		accessToken: randomBytes(30).toString("base64"),
// 		refreshToken: randomBytes(30).toString("base64"),
// 		accessTokenValidUntil: new Date(Date.now() + FIFTEEN_MINUTES),
// 		refreshTokenValidUntil: new Date(Date.now() + ONE_DAY),
// 	});
// }
