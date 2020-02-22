import { settings } from '../../../settings/server';
import { getUserPreference, getURL } from '../../../utils/server';
import { API } from '../api';

API.helperMethods.set('getUserInfo', function _getUserInfo(me) {
	const isVerifiedEmail = () => {
		if (me && me.emails && Array.isArray(me.emails)) {
			return me.emails.find((email) => email.verified);
		}
		return false;
	};
	const getUserPreferences = () => {
		const defaultUserSettingPrefix = 'Accounts_Default_User_Preferences_';
		const allDefaultUserSettings = settings.get(new RegExp(`^${ defaultUserSettingPrefix }.*$`));

		return allDefaultUserSettings.reduce((accumulator, setting) => {
			const settingWithoutPrefix = setting.key.replace(defaultUserSettingPrefix, ' ').trim();
			accumulator[settingWithoutPrefix] = getUserPreference(me, settingWithoutPrefix);
			return accumulator;
		}, {});
	};
	const verifiedEmail = isVerifiedEmail();
	me.email = verifiedEmail ? verifiedEmail.address : undefined;

	me.avatarUrl = getURL(`/avatar/${ me.username }`, { cdn: false, full: true });

	const userPreferences = (me.settings && me.settings.preferences) || {};

	me.settings = {
		preferences: {
			...getUserPreferences(),
			...userPreferences,
		},
	};

	me.telephoneNumber = '';
	let phoneFieldName = '';

	settings.get('Contacts_Phone_Custom_Field_Name', function(name, fieldName) {
		phoneFieldName = fieldName;
	});

	let phoneFieldArray = [];
	if (phoneFieldName) {
		phoneFieldArray = phoneFieldName.split(',');
	}

	if (phoneFieldArray.length > 0) {
		let dict = me;
		for (let i = 0; i < phoneFieldArray.length - 1; i++) {
			if (phoneFieldArray[i] in dict) {
				dict = dict[phoneFieldArray[i]];
			}
		}
		const phone = dict[phoneFieldArray[phoneFieldArray.length - 1]];
		if (phone) {
			me.telephoneNumber = phone;
		}
	}

	return me;
});
