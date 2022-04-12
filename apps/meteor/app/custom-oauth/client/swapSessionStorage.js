import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { Reload } from 'meteor/reload';

// TODO: This is a nasty workaround and should be removed as soon as possible
// Firefox is losing the sessionStorage data (v >= 79.0) after the redirect

if (navigator.userAgent.indexOf('Firefox') !== -1) {
	const KEY_NAME = 'Swapped_Storage_Workaround';

	OAuth.saveDataForRedirect = (loginService, credentialToken) => {
		Meteor._localStorage.setItem(KEY_NAME, JSON.stringify({ loginService, credentialToken }));
		Reload._migrate(null, { immediateMigration: true });
	};

	OAuth.getDataAfterRedirect = () => {
		let migrationData = Meteor._localStorage.getItem(KEY_NAME);
		Meteor._localStorage.removeItem(KEY_NAME);
		try {
			migrationData = JSON.parse(migrationData);
		} catch (error) {
			migrationData = null;
		}

		if (!(migrationData && migrationData.credentialToken)) {
			return null;
		}

		const { credentialToken } = migrationData;
		const key = OAuth._storageTokenPrefix + credentialToken;
		let credentialSecret;
		try {
			credentialSecret = sessionStorage.getItem(key);
			sessionStorage.removeItem(key);
		} catch (e) {
			Meteor._debug('error retrieving credentialSecret', e);
		}
		return {
			loginService: migrationData.loginService,
			credentialToken,
			credentialSecret,
		};
	};
}
