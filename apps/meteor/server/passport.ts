import { Users } from '@rocket.chat/models';
import express from 'express';
import session from 'express-session';
import { Accounts } from 'meteor/accounts-base';
import { WebApp } from 'meteor/webapp';
import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';

passport.use(
	new FacebookStrategy(
		{
			clientID: process.env.FACEBOOK_CLIENT_ID as string,
			clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
			callbackURL: 'http://localhost:3000/auth/facebook/callback',
			pkce: true,
			state: true,
			graphAPIVersion: 'v22.0',
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

passport.use(
	new GitHubStrategy(
		{
			clientID: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			callbackURL: 'http://localhost:3000/auth/github/callback',
			state: true,
			pkce: true,
		},
		(accessToken, refreshToken, profile, done) => {
			console.log(
				'Github strategy',
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
			done(null, {
				provider: 'github',
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

passport.deserializeUser(async (id, done) => {
	const user = Users.findOneById(id);

	console.log('deserializeUser', user);
	// we don’t actually use this user later
	done(null, user);
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
			secure: process.env.NODE_ENV === 'production',
			maxAge: 5 * 60 * 1000, // 5 minutes
		},
	}),
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'], failureRedirect: '/login', failureFlash: true }));

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

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), async (req, res) => {
	console.log('github/callback', req.user);

	const oAuthUser = req.user;
	console.log('oAuthUser', oAuthUser);

	const user = await Accounts.updateOrCreateUserFromExternalService('github', { ...oAuthUser, id: oAuthUser.providerId });
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
