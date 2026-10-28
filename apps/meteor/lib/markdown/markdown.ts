/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
import { escapeHTML } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';

import { filtered } from './parser/filtered/filtered';
import { code } from './parser/original/code';
import { original } from './parser/original/original';

const parsers = {
	original,
	filtered,
};

class MarkdownClass {
	parse(text: string) {
		const message = {
			html: escapeHTML(text),
		};
		return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
	}

	parseNotEscaped(text: string) {
		const message = {
			html: text,
		};
		return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
	}

	parseMessageNotEscaped(message: any) {
		const options = {
			rootUrl: Meteor.absoluteUrl(),
		};

		return parsers.original(message, options);
	}

	mountTokensBackRecursively(message: any, tokenList: any[], useHtml = true) {
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

	mountTokensBack(message: any, useHtml = true) {
		if (message.tokens) {
			this.mountTokensBackRecursively(message, message.tokens, useHtml);
		}

		return message;
	}

	code(message: any) {
		return code(message);
	}
}

export const Markdown = new MarkdownClass();

export const createMarkdownMessageRenderer =
	(options: { supportSchemesForLink?: string; headers?: boolean; rootUrl?: string }) => (message: any) => {
		if (!message?.html?.trim()) {
			return message;
		}

		return parsers.original(message, options);
	};

export const createMarkdownNotificationRenderer = () => (message: any) => parsers.filtered(message);
