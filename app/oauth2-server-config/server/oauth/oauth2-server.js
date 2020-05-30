import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { OAuth2Server } from 'meteor/rocketchat:oauth2-server';

import { OAuthApps, Users } from '../../../models';
import { API } from '../../../../server/api';

const oauth2server = new OAuth2Server({
	accessTokensCollectionName: 'rocketchat_oauth_access_tokens',
	refreshTokensCollectionName: 'rocketchat_oauth_refresh_tokens',
	authCodesCollectionName: 'rocketchat_oauth_auth_codes',
	clientsCollection: OAuthApps.model,
	debug: true,
});

oauth2server.app.disable('x-powered-by');
oauth2server.routes.disable('x-powered-by');

WebApp.connectHandlers.use(oauth2server.app);

oauth2server.routes.get('/oauth/userinfo', function(req, res) {
	if (req.headers.authorization == null) {
		return res.sendStatus(401).send('No token');
	}
	const accessToken = req.headers.authorization.replace('Bearer ', '');
	const token = oauth2server.oauth.model.AccessTokens.findOne({
		accessToken,
	});
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
		picture: `${ Meteor.absoluteUrl() }avatar/${ user.username }`,
	});
});

API.v1.addAuthMethod(function() {
	let headerToken = this.request.headers.authorization;
	const getToken = this.request.query.access_token;
	if (headerToken != null) {
		const matches = headerToken.match(/Bearer\s(\S+)/);
		if (matches) {
			headerToken = matches[1];
		} else {
			headerToken = undefined;
		}
	}
	const bearerToken = headerToken || getToken;
	if (bearerToken == null) {
		return;
	}
	const getAccessToken = Meteor.wrapAsync(oauth2server.oauth.model.getAccessToken, oauth2server.oauth.model);
	const accessToken = getAccessToken(bearerToken);
	if (accessToken == null) {
		return;
	}
	if ((accessToken.expires != null) && accessToken.expires !== 0 && accessToken.expires < new Date()) {
		return;
	}
	const user = Users.findOne(accessToken.userId);
	if (user == null) {
		return;
	}
	return { user };
});
