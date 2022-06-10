/* eslint-disable @typescript-eslint/camelcase */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { WebApp } from 'meteor/webapp';
import { OAuth2Server } from 'meteor/rocketchat:oauth2-server';
import { Request, Response } from 'express';

import { Users } from '../../../models/server';
import { OAuthApps } from '../../../models/server/raw';
import { API } from '../../../api/server';

const oauth2server = new OAuth2Server({
	accessTokensCollectionName: 'rocketchat_oauth_access_tokens',
	refreshTokensCollectionName: 'rocketchat_oauth_refresh_tokens',
	authCodesCollectionName: 'rocketchat_oauth_auth_codes',
	// TODO: Remove workaround. Used to pass meteor collection reference to a package
	clientsCollection: new Mongo.Collection(OAuthApps.col.collectionName),
	debug: true,
});

// https://github.com/RocketChat/rocketchat-oauth2-server/blob/e758fd7ef69348c7ceceabe241747a986c32d036/model.coffee#L27-L27
function getAccessToken(accessToken: string): any {
	return oauth2server.oauth.model.AccessTokens.findOne({
		accessToken,
	});
}

oauth2server.app.disable('x-powered-by');
oauth2server.routes.disable('x-powered-by');

WebApp.connectHandlers.use(oauth2server.app);

oauth2server.routes.get('/oauth/userinfo', function (req: Request, res: Response) {
	if (req.headers.authorization == null) {
		return res.sendStatus(401).send('No token');
	}
	const accessToken = req.headers.authorization.replace('Bearer ', '');
	const token = getAccessToken(accessToken);
	if (token == null) {
		return res.sendStatus(401).send('Invalid Token');
	}
	const user = Users.findOneById(token.userId);
	if (user == null) {
		return res.sendStatus(401).send('Invalid Token');
	}
	return res.send({
		sub: user._id,
		name: user.name,
		email: user.emails[0].address,
		email_verified: user.emails[0].verified,
		department: '',
		birthdate: '',
		preffered_username: user.username,
		updated_at: user._updatedAt,
		picture: `${Meteor.absoluteUrl()}avatar/${user.username}`,
	});
});

API.v1.addAuthMethod(function () {
	const headerToken = this.request.headers.authorization;
	const getToken = this.request.query.access_token;

	let token: string | undefined;
	if (headerToken != null) {
		const matches = headerToken.match(/Bearer\s(\S+)/);
		if (matches) {
			token = matches[1];
		} else {
			token = undefined;
		}
	}
	const bearerToken = token || getToken;
	if (bearerToken == null) {
		return;
	}

	const accessToken = getAccessToken(bearerToken);
	if (accessToken == null) {
		return;
	}
	if (accessToken.expires != null && accessToken.expires !== 0 && accessToken.expires < new Date()) {
		return;
	}
	const user = Users.findOne(accessToken.userId);
	if (user == null) {
		return;
	}
	return { user };
});
