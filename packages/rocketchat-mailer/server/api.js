import s from 'underscore.string';
import juice from 'juice';
let contentHeader;
let contentFooter;

let body;
let Settings = {
	get: () => {},
};


export const replacekey = (str, key, value = '') => str.replace(new RegExp(`(\\[${ key }\\]|__${ key }__)`, 'igm'), value);

export const translate = (str) => str.replace(/\{ ?([^\} ]+)(( ([^\}]+))+)? ?\}/gmi, (match, key) => TAPi18n.__(key));

export const replace = function replace(str, data = {}) {
	if (!str) {
		return '';
	}

	str = translate(str);

	str = replacekey(str, 'Site_Name', Settings.get('Site_Name'));
	str = replacekey(str, 'Site_URL', Settings.get('Site_Url'));
	console.log('AQUE', data, str);
	str = replacekey(str, 'name', data.name);
	str = replacekey(str, 'fname', s.strLeft(data.name, ' '));
	str = replacekey(str, 'lname', s.strRightBack(data.name, ' '));
	str = replacekey(str, 'email', data.email);
	str = replacekey(str, 'password', data.password);
	str = replacekey(str, 'reason', data.reason);
	str = replacekey(str, 'User', data.user);
	str = replacekey(str, 'Room', data.room);

	if (data.unsubscribe) {
		str = replacekey(str, 'unsubscribe', data.unsubscribe);
	}
	return str;
	// return str.replace(/([^>\r\n]?)([\r\n|\n\r|\r|\n]+)/g, '$1' + '<br>' + '$2');
};

export const inlinecss = (html) => {
	const css = Settings.get('email_style');
	return juice.inlineContent(html, css);
};

export const setSettings = (s) => {
	Settings = s;
	Settings.get('Email_Header', (key, value) => {
		contentHeader = replace(value || '');
	});

	Settings.get('Email_Footer', (key, value) => {
		contentFooter = replace(value || '');
	});

	body = inlinecss(`${ contentHeader } {{body}} ${ contentFooter }`);
};


export const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;

export const checkEmail = (from) => rfcMailPatternWithName.test(from);

export const sendNoWrap = ({ to, from, subject, html }) => {
	if (!checkEmail(to)) {
		return;
	}
	Meteor.defer(() => Email.send({ to, from, subject, html }));
};

export const wrap = (html) => body.replace('{{body}}', html);

export const send = ({ to, from, subject, html }) => sendNoWrap({ to, from, subject, html: wrap(html) });

export const checkEmailandThrow = (from, func) => {
	if (checkEmail(from)) {
		return;
	}
	throw new Meteor.Error('error-invalid-from-address', 'Invalid from address', {
		function: func,
	});
};


export const getHeader = () => contentHeader;

export const getFooter = () => contentFooter;
