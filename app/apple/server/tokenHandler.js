import { decodeToken } from 'blockstack';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';

export const handleAccessToken = (loginRequest) => {
	check(loginRequest, Match.ObjectIncluding({
		identityToken: String,
		fullName: Object,
		email: String,
	}));

	const decodedToken = decodeToken(loginRequest.identityToken).payload;

	const { givenName, familyName } = loginRequest.fullName;

	const profile = {};
	profile.name = `${ givenName } ${ familyName }`;

	const { iss, iat, exp } = decodedToken;

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

	return {
		serviceData,
		options: { profile },
	};
};
