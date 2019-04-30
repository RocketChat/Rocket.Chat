/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
import s from 'underscore.string';
import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';

import { marked } from './parser/marked/marked.js';
import { original } from './parser/original/original.js';
import { code } from './parser/original/code.js';
import { callbacks } from '../../callbacks';
import { settings } from '../../settings';

const parsers = {
	original,
	marked,
};

class MarkdownClass {
	parse(text) {
		const message = {
			html: s.escapeHTML(text),
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

		if (typeof parsers[parser] === 'function') {
			return parsers[parser](message);
		}
		return parsers.original(message);
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
}

export const Markdown = new MarkdownClass;

// renderMessage already did html escape
const MarkdownMessage = (message) => {
	if (s.trim(message != null ? message.html : undefined)) {
		message = Markdown.parseMessageNotEscaped(message);
	}

	return message;
};

callbacks.add('renderMessage', MarkdownMessage, callbacks.priority.HIGH, 'markdown');

if (Meteor.isClient) {
	Blaze.registerHelper('RocketChatMarkdown', (text) => Markdown.parse(text));
	Blaze.registerHelper('RocketChatMarkdownUnescape', (text) => Markdown.parseNotEscaped(text));
	Blaze.registerHelper('RocketChatMarkdownInline', (text) => {
		const output = Markdown.parse(text);
		return output.replace(/^<p>/, '').replace(/<\/p>$/, '');
	});
}
