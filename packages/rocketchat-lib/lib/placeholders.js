RocketChat.placeholders = {};

RocketChat.placeholders.replace = function(str, data) {
	if (!str) {
		return "";
	}

	str = str.replace(/\[Site_Name\]/g, RocketChat.settings.get("Site_Name") || '');
	str = str.replace(/\[Site_URL\]/g, RocketChat.settings.get("Site_Url") || '');

	if (data) {
		str = str.replace(/\[name\]/g, data.name || '');
		str = str.replace(/\[fname\]/g, _.strLeft(data.name, ' ') || '');
		str = str.replace(/\[lname\]/g, _.strRightBack(data.name, ' ') || '');
		str = str.replace(/\[email\]/g, data.email || '');
		str = str.replace(/\[password\]/g, data.password || '');
	}

	return str;
};
