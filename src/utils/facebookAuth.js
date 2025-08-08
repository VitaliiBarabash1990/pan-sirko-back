import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import dotenv from "dotenv";

import { UsersCollection } from "../db/models/user.js";
import { SessionsCollection } from "../db/models/session.js";
import { createSession } from "../services/auth.js";

dotenv.config();

passport.use(
	new FacebookStrategy(
		{
			clientID: process.env.FACEBOOK_APP_ID,
			clientSecret: process.env.FACEBOOK_APP_SECRET,
			callbackURL: process.env.FACEBOOK_CALLBACK_URL,
			profileFields: ["id", "displayName", "emails", "photos"],
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				// Знаходимо користувача за facebookId або email
				let user = await UsersCollection.findOne({
					$or: [
						{ facebookId: profile.id },
						{ email: profile.emails?.[0]?.value },
					],
				});

				if (!user) {
					user = await UsersCollection.create({
						facebookId: profile.id,
						name: profile.displayName,
						email: profile.emails?.[0]?.value || null,
						avatar: profile.photos?.[0]?.value || null,
					});
				}

				// Створюємо нову сесію
				const newSessionData = createSession();
				const session = await SessionsCollection.create({
					userId: user._id,
					...newSessionData,
				});

				// Підкладаємо сесію і користувача у req
				done(null, { user, session });
			} catch (err) {
				done(err, null);
			}
		}
	)
);
