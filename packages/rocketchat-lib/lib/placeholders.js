RocketChat.placeholders = {};

RocketChat.placeholders.replace = function(str, data) {
	if (!str) {
		return '';
	}

	str = str.replace(/\[Site_Name\]/g, RocketChat.settings.get('Site_Name') || '');
	str = str.replace(/\[Site_URL\]/g, RocketChat.settings.get('Site_Url') || '');

	if (data) {
		str = str.replace(/\[name\]/g, data.name || '');
		str = str.replace(/\[fname\]/g, _.strLeft(data.name, ' ') || '');
		str = str.replace(/\[lname\]/g, _.strRightBack(data.name, ' ') || '');
		str = str.replace(/\[email\]/g, data.email || '');
		str = str.replace(/\[password\]/g, data.password || '');

		if (data.unsubscribe) {
			str = str.replace(/\[unsubscribe\]/g, data.unsubscribe);
		}
	}

	str = str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');


	return str;
};
