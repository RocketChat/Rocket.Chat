/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
import { Meteor } from 'meteor/meteor';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { marked } from './parser/marked/marked';
import { original } from './parser/original/original';
import { filtered } from './parser/filtered/filtered';
import { code } from './parser/original/code';
import { settings } from '../../settings';

const parsers = {
	original,
	marked,
	filtered,
};

class MarkdownClass {
	parse(text) {
		const message = {
			html: escapeHTML(text),
		};
		return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
	}

	parseNotEscaped(text) {
		const message = {
			html: text,
		};
		return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
	}

	parseMessageNotEscaped(message) {
		const parser = settings.get('Markdown_Parser');

		if (parser === 'disabled') {
			return message;
		}

		const options = {
			supportSchemesForLink: settings.get('Markdown_SupportSchemesForLink'),
			headers: settings.get('Markdown_Headers'),
			rootUrl: Meteor.absoluteUrl(),
			marked: {
				gfm: settings.get('Markdown_Marked_GFM'),
				tables: settings.get('Markdown_Marked_Tables'),
				breaks: settings.get('Markdown_Marked_Breaks'),
				pedantic: settings.get('Markdown_Marked_Pedantic'),
				smartLists: settings.get('Markdown_Marked_SmartLists'),
				smartypants: settings.get('Markdown_Marked_Smartypants'),
			},
		};

		const parse = typeof parsers[parser] === 'function' ? parsers[parser] : parsers.original;

		return parse(message, options);
	}

	mountTokensBackRecursively(message, tokenList, useHtml = true) {
		const missingTokens = [];

		if (tokenList.length > 0) {
			for (const { token, text, noHtml } of tokenList) {
				if (message.html.indexOf(token) >= 0) {
					message.html = message.html.replace(token, () => (useHtml ? text : noHtml)); // Uses lambda so doesn't need to escape $
				} else {
					missingTokens.push({ token, text, noHtml });
				}
			}
		}

		// If there are tokens that were missing from the string, but the last iteration replaced at least one token, then go again
		// this is done because one of the tokens may have been hidden by another one
		if (missingTokens.length > 0 && missingTokens.length < tokenList.length) {
			this.mountTokensBackRecursively(message, missingTokens, useHtml);
		}
	}

	mountTokensBack(message, useHtml = true) {
		if (message.tokens) {
			this.mountTokensBackRecursively(message, message.tokens, useHtml);
		}

		return message;
	}

	code(...args) {
		return code(...args);
	}

	filterMarkdownFromMessage(message) {
		return parsers.filtered(message, {
			supportSchemesForLink: settings.get('Markdown_SupportSchemesForLink'),
		});
	}
}

export const Markdown = new MarkdownClass();

export const filterMarkdown = (message) => Markdown.filterMarkdownFromMessage(message);

export const createMarkdownMessageRenderer = ({ parser, ...options }) => {
	if (!parser || parser === 'disabled') {
		return (message) => message;
	}

	const parse = typeof parsers[parser] === 'function' ? parsers[parser] : parsers.original;

	return (message) => {
		if (!message?.html?.trim()) {
			return message;
		}

		return parse(message, options);
	};
};

export const createMarkdownNotificationRenderer = (options) => (message) => parsers.filtered(message, options);
