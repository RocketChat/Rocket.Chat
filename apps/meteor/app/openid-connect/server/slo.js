import { WebApp } from 'meteor/webapp';
import { Accounts } from 'meteor/accounts-base';
import { Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { settings } from '../../../../settings/server';

import { createRemoteJWKSet, jwtVerify } from 'jose';

WebApp.connectHandlers.use('/_slo', async (req, res, next) => {
	const { logout_token } = req.body;

	if (!logout_token) {
		res.writeHead(400);
		res.end('Missing logout_token');
		return;
	}

	const issuer = settings.get('OIDC_Issuer');
	const audience = settings.get('OIDC_Client_ID');

	const discovery = await (await fetch(`${issuer}/.well-known/openid-configuration`)).json();
	const jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));

	try {
		const { payload } = await jwtVerify(logout_token, jwks, {
			issuer,
			audience,
		});

		const user = await Users.findOneBySvcId('oidc', payload.sub);
		if (user) {
			await Users.unsetLoginTokens(user._id);
		}

		res.writeHead(200);
		res.end('Logout successful');
	} catch (err) {
		res.writeHead(400);
		res.end('Invalid logout_token');
	}
});
