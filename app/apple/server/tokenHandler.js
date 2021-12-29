import { jws } from 'jsrsasign';
import NodeRSA from 'node-rsa';
import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';

const isValidAppleJWT = (identityToken, header) => {
	const applePublicKeys = HTTP.get('https://appleid.apple.com/auth/keys').data.keys;
	const { kid } = header;

	const key = applePublicKeys.find((k) => k.kid === kid);

	const pubKey = new NodeRSA();
	pubKey.importKey({ n: Buffer.from(key.n, 'base64'), e: Buffer.from(key.e, 'base64') }, 'components-public');
	const userKey = pubKey.exportKey(['public']);

	try {
		return jws.JWS.verify(identityToken, userKey, {
			typ: 'JWT',
			alg: 'RS256',
		});
	} catch {
		return false;
	}
};

export const handleIdentityToken = ({ identityToken, fullName = {}, email }) => {
	check(identityToken, String);
	check(fullName, Match.Maybe(Object));
	check(email, Match.Maybe(String));

	const decodedToken = jws.JWS.parse(identityToken);

	if (!isValidAppleJWT(identityToken, decodedToken.headerObj)) {
		return {
			type: 'apple',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'identityToken is a invalid JWT'),
		};
	}

	const profile = {};

	const { givenName, familyName } = fullName;
	if (givenName && familyName) {
		profile.name = `${givenName} ${familyName}`;
	}

	const { iss, iat, exp } = decodedToken.payloadObj;

	if (!iss) {
		return {
			type: 'apple',
			error: new Meteor.Error(Accounts.LoginCancelledError.numericError, 'Insufficient data in auth response token'),
		};
	}

	// Collect basic auth provider details
	const serviceData = {
		id: iss,
		did: iss.split(':').pop(),
		issuedAt: new Date(iat * 1000),
		expiresAt: new Date(exp * 1000),
	};

	if (email) {
		serviceData.email = email;
	}

	return {
		serviceData,
		options: { profile },
	};
};
