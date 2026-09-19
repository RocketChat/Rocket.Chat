import { Accounts } from 'meteor/accounts-base';
import { Google } from 'meteor/google-oauth';

Accounts.oauth.registerService('google');

Accounts.addAutopublishFields({
	forLoggedInUser:
		// publish access token since it can be used from the client (if
		// transmitted over ssl or on
		// localhost). https://developers.google.com/accounts/docs/OAuth2UserAgent
		// refresh token probably shouldn't be sent down.
		Google.whitelistedFields.concat(['accessToken', 'expiresAt']).map(
			(subfield) => `services.google.${subfield}`, // don't publish refresh token
		),

	forOtherUsers:
		// even with autopublish, no legitimate web app should be
		// publishing all users' emails
		Google.whitelistedFields
			.filter((field) => field !== 'email' && field !== 'verified_email')
			.map((subfield) => `services.google.${subfield}`),
});
