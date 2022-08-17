import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';
import s from 'underscore.string';
import juice from 'juice';
import stripHtml from 'string-strip-html';
import { escapeHTML } from '@rocket.chat/string-helpers';
import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { settings } from '../../settings/server';
import { replaceVariables } from './replaceVariables';
import { Apps } from '../../apps/server';
import { validateEmail } from '../../../lib/emailValidator';

let contentHeader: string | undefined;
let contentFooter: string | undefined;
let body: string | undefined;

// define server language for email translations
// @TODO: change TAPi18n.__ function to use the server language by default
let lng = 'en';
settings.watch<string>('Language', (value) => {
	lng = value || 'en';
});

export const replacekey = (str: string, key: string, value = ''): string =>
	str.replace(new RegExp(`(\\[${key}\\]|__${key}__)`, 'igm'), value);

export const translate = (str: string): string => replaceVariables(str, (_match, key) => TAPi18n.__(key, { lng }));

export const replace = (str: string, data: { [key: string]: unknown } = {}): string => {
	if (!str) {
		return '';
	}

	const options = {
		Site_Name: settings.get<string>('Site_Name'),
		Site_URL: settings.get<string>('Site_Url'),
		Site_URL_Slash: settings.get<string>('Site_Url')?.replace(/\/?$/, '/'),
		...(data.name
			? {
					fname: s.strLeft(String(data.name), ' '),
					lname: s.strRightBack(String(data.name), ' '),
			  }
			: {}),
		...data,
	};

	return Object.entries(options).reduce((ret, [key, value]) => replacekey(ret, key, value), translate(str));
};

const nonEscapeKeys = ['room_path'];

export const replaceEscaped = (str: string, data: { [key: string]: unknown } = {}): string => {
	const siteName = settings.get<string>('Site_Name');
	const siteUrl = settings.get<string>('Site_Url');

	return replace(str, {
		Site_Name: siteName ? escapeHTML(siteName) : undefined,
		Site_Url: siteUrl ? escapeHTML(siteUrl) : undefined,
		...Object.entries(data).reduce<{ [key: string]: string }>((ret, [key, value]) => {
			if (value !== undefined && value !== null) {
				ret[key] = nonEscapeKeys.includes(key) ? String(value) : escapeHTML(String(value));
			}
			return ret;
		}, {}),
	});
};

export const wrap = (html: string, data: { [key: string]: unknown } = {}): string => {
	if (settings.get('email_plain_text_only')) {
		return replace(html, data);
	}

	if (!body) {
		throw new Error('`body` is not set yet');
	}

	return replaceEscaped(body.replace('{{body}}', html), data);
};
export const inlinecss = (html: string): string => {
	const css = settings.get<string>('email_style');
	return css ? juice.inlineContent(html, css) : html;
};

export const getTemplate = (template: ISetting['_id'], fn: (html: string) => void, escape = true): void => {
	let html = '';

	settings.watch<string>(template, (value) => {
		html = value || '';
		fn(escape ? inlinecss(html) : html);
	});

	settings.watch<string>('email_style', () => {
		fn(escape ? inlinecss(html) : html);
	});
};

export const getTemplateWrapped = (template: ISetting['_id'], fn: (html: string) => void): void => {
	let html = '';
	const wrapInlineCSS = _.debounce(() => fn(wrap(inlinecss(html))), 100);

	settings.watch<string>('Email_Header', () => html && wrapInlineCSS());
	settings.watch<string>('Email_Footer', () => html && wrapInlineCSS());
	settings.watch<string>('email_style', () => html && wrapInlineCSS());
	settings.watch<string>(template, (value) => {
		html = value || '';
		return html && wrapInlineCSS();
	});
};

settings.watchMultiple(['Email_Header', 'Email_Footer'], () => {
	getTemplate(
		'Email_Header',
		(value) => {
			contentHeader = replace(value || '');
			body = inlinecss(`${contentHeader} {{body}} ${contentFooter}`);
		},
		false,
	);

	getTemplate(
		'Email_Footer',
		(value) => {
			contentFooter = replace(value || '');
			body = inlinecss(`${contentHeader} {{body}} ${contentFooter}`);
		},
		false,
	);

	body = inlinecss(`${contentHeader} {{body}} ${contentFooter}`);
});

export const checkAddressFormat = (adresses: string | string[]): boolean =>
	([] as string[]).concat(adresses).every((address) => validateEmail(address));

export const sendNoWrap = ({
	to,
	from,
	replyTo,
	subject,
	html,
	text,
	headers,
}: {
	to: string;
	from: string;
	replyTo?: string;
	subject: string;
	html?: string;
	text?: string;
	headers?: string;
}): void => {
	if (!checkAddressFormat(to)) {
		throw new Meteor.Error('invalid email');
	}

	if (!text) {
		text = html ? stripHtml(html).result : undefined;
	}

	if (settings.get('email_plain_text_only')) {
		html = undefined;
	}

	Settings.incrementValueById('Triggered_Emails_Count');

	const email = { to, from, replyTo, subject, html, text, headers };

	const eventResult = Promise.await(Apps.triggerEvent('IPreEmailSent', { email }));

	Meteor.defer(() => Email.send(eventResult || email));
};

export const send = ({
	to,
	from,
	replyTo,
	subject,
	html,
	text,
	data,
	headers,
}: {
	to: string;
	from: string;
	replyTo?: string;
	subject: string;
	html?: string;
	text?: string;
	headers?: string;
	data?: { [key: string]: unknown };
}): void =>
	sendNoWrap({
		to,
		from,
		replyTo,
		subject: replace(subject, data),
		text: (text && replace(text, data)) || (html && stripHtml(replace(html, data)).result) || undefined,
		html: html ? wrap(html, data) : undefined,
		headers,
	});

// Needed because of https://github.com/microsoft/TypeScript/issues/36931
type Assert = (input: string, func: string) => asserts input;
export const checkAddressFormatAndThrow: Assert = (from: string, func: string): asserts from => {
	if (checkAddressFormat(from)) {
		return;
	}

	throw new Meteor.Error('error-invalid-from-address', 'Invalid from address', {
		function: func,
	});
};

export const getHeader = (): string | undefined => contentHeader;

export const getFooter = (): string | undefined => contentFooter;
