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
		settings
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
		settings
	};
};


RocketChat.API.helperMethods.set('getUserInfo', function _getUserInfo(user) {
	const me = getInfoFromUserObject(user);
	const verifiedEmail = me.emails.find((email) => email.verified);
	const getUserPreferences = () => {
		const defaultUserSettingPrefix = 'Accounts_Default_User_Preferences_';
		const allDefaultUserSettings = RocketChat.settings.get(new RegExp(`^${ defaultUserSettingPrefix }.*$`));

		return allDefaultUserSettings.reduce((accumulator, setting) => {
			const settingWithoutPrefix = setting.key.replace(defaultUserSettingPrefix, ' ').trim();
			accumulator[settingWithoutPrefix] = RocketChat.getUserPreference(user, settingWithoutPrefix);
			return accumulator;
		}, {});
	};

	me.email = verifiedEmail ? verifiedEmail.address : undefined;
	me.settings = {
		preferences: getUserPreferences()
	};

	return me;
});
