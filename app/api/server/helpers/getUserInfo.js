import { settings } from '../../../settings';
import { getUserPreference, getURL } from '../../../utils';
import { API } from '../api';

const getInfoFromUserObject = (user) => {
	const {
		_id,
		name,
		emails,
		status,
		statusConnection,
		username,
		utcOffset,
		active,
		language,
		roles,
		settings,
		customFields,
	} = user;
	return {
		_id,
		name,
		emails,
		status,
		statusConnection,
		username,
		utcOffset,
		active,
		language,
		roles,
		settings,
		customFields,
	};
};


API.helperMethods.set('getUserInfo', function _getUserInfo(user) {
	const me = getInfoFromUserObject(user);
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
			accumulator[settingWithoutPrefix] = getUserPreference(user, settingWithoutPrefix);
			return accumulator;
		}, {});
	};
	const verifiedEmail = isVerifiedEmail();
	me.email = verifiedEmail ? verifiedEmail.address : undefined;

	me.avatarUrl = getURL(`/avatar/${ me.username }`, { cdn: false, full: true });

	me.settings = {
		preferences: getUserPreferences(),
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
		let dict = user;
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
