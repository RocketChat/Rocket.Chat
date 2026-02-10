import { Users } from '@rocket.chat/models';
import express from 'express';
import session from 'express-session';
import { Accounts } from 'meteor/accounts-base';
import { WebApp } from 'meteor/webapp';
import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';

passport.use(
	new FacebookStrategy(
		{
			clientID: 'process.env.FACEBOOK_CLIENT_ID',
			clientSecret: 'process.env.FACEBOOK_APP_SECRET',
			callbackURL: 'http://localhost:3000/auth/facebook/callback',
		},
		(accessToken, refreshToken, profile, cb) => {
			console.log(
				'facebook strategy',
				JSON.stringify(
					{
						accessToken,
						refreshToken,
						profile,
					},
					null,
					2,
				),
			);
			cb(null, {
				provider: 'facebook',
				providerId: profile.id,
				email: profile?.emails?.[0]?.value,
				name: profile.displayName,
			});
		},
	),
);

passport.serializeUser((user, done) => {
	console.log('serializeUser', user);
	// store the bare minimum
	done(null, user.providerId);
});

passport.deserializeUser((id, done) => {
	console.log('deserializeUser', id);
	// we don’t actually use this user later
	done(null, { providerId: id });
});

const app = express();
app.use(
	session({
		name: 'oauth.tmp',
		secret: 'something test',
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: true,
			maxAge: 5 * 60 * 1000, // 5 minutes
		},
	}),
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), async (req, res) => {
	console.log('facebook/callback', req.user);

	const oAuthUser = req.user;
	console.log('oAuthUser', oAuthUser);

	const user = await Accounts.updateOrCreateUserFromExternalService('facebook', { ...oAuthUser, id: oAuthUser.providerId });
	console.log('user', user);

	if (!user?.userId) {
		return res.redirect('/login');
	}

	const userFromDB = await Users.findOneById(user?.userId as string);
	console.log('userFromDB', userFromDB);

	const stampedToken = Accounts._generateStampedLoginToken();
	Accounts._insertLoginToken(userFromDB?._id as string, stampedToken);

	res.redirect(`http://localhost:3000/home?resumeToken=${stampedToken.token}`);

	req.session.destroy((err) => {
		if (err) {
			console.error('Error destroying session', err);
		}
	});
});

WebApp.connectHandlers.use(app);
