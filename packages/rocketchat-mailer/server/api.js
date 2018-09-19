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
export const replace = function replace(text, data = {}) {
	if (!text) {
		return '';
	}

	return Object.entries({
		Site_Name: Settings.get('Site_Name'),
		Site_URL: Settings.get('Site_Url'),
		...(data.name && {
			fname: s.strLeft(data.name, ' '),
			lname: s.strRightBack(data.name, ' '),
		}),
		...data,
	}).reduce((ret, [key, value]) => replacekey(ret, key, value), translate(text));
};

export const replaceEscaped = (str, data = {}) => {
	if (!str) {
		return '';
	}
	return replace(str, {
		Site_Name: s.escapeHTML(RocketChat.settings.get('Site_Name')),
		Site_Url: s.escapeHTML(RocketChat.settings.get('Site_Url')),
		...Object.entries(data).map(([key, value]) => ({ [key]: s.escapeHTML(value) })),
	});
};



export const inlinecss = (html) => juice.inlineContent(html, Settings.get('email_style'));

export const setSettings = (s) => {
	Settings = s;
	Settings.get('Email_Header', (key, value) => {
		contentHeader = replace(value || '');
		body = inlinecss(`${ contentHeader } {{body}} ${ contentFooter }`);
	});

	Settings.get('Email_Footer', (key, value) => {
		contentFooter = replace(value || '');
		body = inlinecss(`${ contentHeader } {{body}} ${ contentFooter }`);
	});

	body = inlinecss(`${ contentHeader } {{body}} ${ contentFooter }`);
};


export const rfcMailPatternWithName = /^(?:.*<)?([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)(?:>?)$/;

export const checkAddressFormat = (from) => rfcMailPatternWithName.test(from);

export const sendNoWrap = ({ to, from, subject, html }) => {
	if (!checkAddressFormat(to)) {
		return;
	}
	Meteor.defer(() => Email.send({ to, from, subject, html }));
};

export const wrap = (html, data = {}) => replaceEscaped(body.replace('{{body}}', html), data);

export const send = ({ to, from, subject, html, data }) => sendNoWrap({ to, from, subject: replace(subject, data), html: wrap(html, data) });

export const checkAddressFormatAndThrow = (from, func) => {
	if (checkAddressFormat(from)) {
		return true;
	}
	throw new Meteor.Error('error-invalid-from-address', 'Invalid from address', {
		function: func,
	});
};


export const getHeader = () => contentHeader;

export const getFooter = () => contentFooter;
