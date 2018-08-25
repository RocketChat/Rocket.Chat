import s from 'underscore.string';

RocketChat.placeholders = {};

const replace = (str, data) => {
	str = Object.entries(data)
		.reduce((str, [key, value]) => str.replace(new RegExp(`\\[${ key }\\]`, 'g'), value || ''), str);

	str = str.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br>' + '$2');

	return str;
};

RocketChat.placeholders.replace = (str, data) => {
	if (!str) {
		return '';
	}

	return replace(str, {
		Site_Name: RocketChat.settings.get('Site_Name'),
		Site_Url: RocketChat.settings.get('Site_Url'),
		...(data || {}),
	});
};

RocketChat.placeholders.replaceEscaped = (str, data) => {
	if (!str) {
		return '';
	}

	return replace(str, {
		Site_Name: s.escapeHTML(RocketChat.settings.get('Site_Name')),
		Site_Url: s.escapeHTML(RocketChat.settings.get('Site_Url')),
		...Object.assign({}, ...Object.entries(data || {}).map(([key, value]) => ({ [key]: s.escapeHTML(value) }))),
	});
};
