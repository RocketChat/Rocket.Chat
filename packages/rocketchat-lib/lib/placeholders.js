import s from 'underscore.string';

RocketChat.placeholders = {};

RocketChat.placeholders.replace = function(str, data) {
	if (!str) {
		return '';
	}

	str = str.replace(/\[Site_Name\]/g, RocketChat.settings.get('Site_Name') || '');
	str = str.replace(/\[Site_URL\]/g, RocketChat.settings.get('Site_Url') || '');

	let iurl = RocketChat.settings.get('Site_Url');
	if (iurl.slice(-1) !== '/') {
		iurl += '/';
	}
	iurl += 'register/';
	// only add secret if registration is set to Secret URL
	if (RocketChat.settings.get('Accounts_RegistrationForm') === 'Secret URL') {
		iurl + RocketChat.settings.get('Accounts_RegistrationForm_SecretURL');
	}
	str = str.replace(/\[Invite_URL\]/g, iurl || '');

	if (data) {
		str = str.replace(/\[name\]/g, data.name || '');
		str = str.replace(/\[fname\]/g, s.strLeft(data.name, ' ') || '');
		str = str.replace(/\[lname\]/g, s.strRightBack(data.name, ' ') || '');
		str = str.replace(/\[email\]/g, data.email || '');
		str = str.replace(/\[password\]/g, data.password || '');
		str = str.replace(/\[User\]/g, data.user || '');
		str = str.replace(/\[Room\]/g, data.room || '');

		if (data.unsubscribe) {
			str = str.replace(/\[unsubscribe\]/g, data.unsubscribe);
		}
	}

	str = str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');


	return str;
};
