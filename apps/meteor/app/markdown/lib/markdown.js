/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
import { escapeHTML } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';

import { filtered } from './parser/filtered/filtered';
import { code } from './parser/original/code';
import { original } from './parser/original/original';

const parsers = {
	original,
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
		const options = {
			rootUrl: Meteor.absoluteUrl(),
		};

		return parsers.original(message, options);
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

	/** @param {string} message */
	filterMarkdownFromMessage(message) {
		return parsers.filtered(message);
	}
}

export const Markdown = new MarkdownClass();

/** @param {string} message */
export const filterMarkdown = (message) => Markdown.filterMarkdownFromMessage(message);

export const createMarkdownMessageRenderer = ({ ...options }) => {
	const markedParser = parsers.marked;
	return (message, useMarkedParser = false) => {
		if (!message?.html?.trim()) {
			return message;
		}

		return useMarkedParser ? markedParser(message, options) : parsers.original(message, options);
	};
};

export const createMarkdownNotificationRenderer = () => (message) => parsers.filtered(message);
