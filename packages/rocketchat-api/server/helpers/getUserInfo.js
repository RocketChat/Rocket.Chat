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


RocketChat.API.helperMethods.set('getUserInfo', function _getUserInfo(userId) {
	const user = RocketChat.models.Users.findOneById(userId);
	const me = getInfoFromUserObject(user);
	const verifiedEmail = me.emails.find((email) => email.verified);
	const userHasNotSetPreferencesYet = !me.settings || !me.settings.preferences;

	me.email = verifiedEmail ? verifiedEmail.address : undefined;
	if (userHasNotSetPreferencesYet) {
		me.settings = { preferences: {} };
	}

	return me;
});
