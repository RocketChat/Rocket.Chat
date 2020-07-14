import { decodeToken } from 'blockstack';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Match, check } from 'meteor/check';

export const handleAccessToken = ({ identityToken, fullName, email }) => {
	check(identityToken, String);
	check(fullName, Match.Maybe(Object));
	check(email, Match.Maybe(String));

	const decodedToken = decodeToken(identityToken).payload;

	const profile = {};

	const { givenName, familyName } = fullName;
	if (givenName && familyName) {
		profile.name = `${ givenName } ${ familyName }`;
	}

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

	if (email) {
		serviceData.email = email;
	}

	return {
		serviceData,
		options: { profile },
	};
};
