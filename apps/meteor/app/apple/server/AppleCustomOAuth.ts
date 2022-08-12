import { Accounts } from 'meteor/accounts-base';
import { HTTP } from 'meteor/http';
import NodeRSA from 'node-rsa';
import { KJUR } from 'jsrsasign';

import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { MeteorError } from '../../../server/sdk/errors';

const isValidAppleJWT = (identityToken: string, header: any): any => {
	const applePublicKeys = HTTP.get('https://appleid.apple.com/auth/keys').data.keys as any;
	const { kid } = header;

	const key = applePublicKeys.find((k: any) => k.kid === kid);

	const pubKey = new NodeRSA();
	pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public');
	const userKey = pubKey.exportKey('public');

	try {
		return KJUR.jws.JWS.verify(identityToken, userKey, ['RS256']);
	} catch {
		return false;
	}
};

export class AppleCustomOAuth extends CustomOAuth {
	getIdentity(_accessToken: string, query: Record<string, any>): any {
		const { id_token: identityToken, user: userStr = '' } = query;

		let user = {} as any;
		try {
			user = JSON.parse(userStr);
		} catch (e) {
			// ignore
		}

		const decodedToken = KJUR.jws.JWS.parse(identityToken);

		if (!isValidAppleJWT(identityToken, decodedToken.headerObj)) {
			return {
				type: 'apple',
				error: new MeteorError(Accounts.LoginCancelledError.numericError, 'identityToken is a invalid JWT'),
			};
		}

		const { iss, sub, email } = decodedToken.payloadObj as any;
		if (!iss) {
			return {
				type: 'apple',
				error: new MeteorError(Accounts.LoginCancelledError.numericError, 'Insufficient data in auth response token'),
			};
		}

		const serviceData = {
			id: sub,
			email,
			name: '',
		};

		if (email) {
			serviceData.email = email;
		}

		if (user?.name) {
			serviceData.name = `${user.name.firstName}${user.name.middleName ? ` ${user.name.middleName}` : ''}${
				user.name.lastName ? ` ${user.name.lastName}` : ''
			}`;
		}

		return serviceData;
	}
}
