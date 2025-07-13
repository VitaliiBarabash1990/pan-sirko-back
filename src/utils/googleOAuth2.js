import createHttpError from "http-errors";
import { OAuth2Client } from "google-auth-library";
import { env } from "./env.js";

const googleOAuth2Client = new OAuth2Client({
	clientId: env("GOOGLE_OAUTH_CLIENT_ID"),
	clientSecret: env("GOOGLE_OAUTH_CLIENT_SECRET"),
	redirectUri: env("GOOGLE_OAUTH_REDIRECT_URL"),
});

export function generateOAuthURL() {
	return googleOAuth2Client.generateAuthUrl({
		scope: [
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		],
	});
}

// export async function validateCode(code) {
// 	try {
// 		const response = await googleOAuth2Client.getToken(code);
// 		console.log("Google getToken response:", response);

// 		const ticket = await googleOAuth2Client.verifyIdToken({
// 			idToken: response.tokens.id_token,
// 			audience: env("GOOGLE_OAUTH_CLIENT_ID"), // важливо!
// 		});

// 		const payload = ticket.getPayload();
// 		console.log("Google payload:", payload);

// 		return {
// 			name: payload.name,
// 			email: payload.email,
// 			picture: payload.picture,
// 		};
// 	} catch (error) {
// 		console.error("validateCode error:", error);

// 		if (
// 			error.response &&
// 			error.response.status >= 400 &&
// 			error.response.status <= 499
// 		) {
// 			throw createHttpError(401, "Unauthorized");
// 		}
// 		throw error;
// 	}
// }

export async function validateCode(code) {
	try {
		const response = await googleOAuth2Client.getToken(code);
		console.log(response);
		const ticket = await googleOAuth2Client.verifyIdToken({
			idToken: response.tokens.id_token,
			audience: env("GOOGLE_OAUTH_CLIENT_ID"),
		});

		console.log(ticket);
		return ticket;
	} catch (error) {
		if (
			error.response &&
			error.response.status >= 400 &&
			error.response.status <= 499
		) {
			throw createHttpError(401, "Unauthorized");
		}
		throw error;
	}
}
