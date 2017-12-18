/**
 * Tries to retrieve the user preference falling back to a default system
 * value or to a default value if it is passed as argument
*/
RocketChat.getUserPreference = function(user, key, defaultValue=undefined) {
	let preference;

	if (user && user.settings && user.settings.preferences &&
		user.settings.preferences.hasOwnProperty(key)) {
		preference = user.settings.preferences[key];
	} else if (defaultValue === undefined) {
		preference = RocketChat.settings.get(`Accounts_Default_User_Preferences_${ key }`);
	}

	return preference !== undefined ? preference : defaultValue;
};
