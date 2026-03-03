import type { Token } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';

import { filtered } from './parser/filtered/filtered';
import { code } from './parser/original/code';
import { original } from './parser/original/original';

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

	parseMessageNotEscaped<TMessage extends { html: string; tokens?: Token[] }>(message: TMessage) {
		const options = {
			rootUrl: Meteor.absoluteUrl(),
		};

		return original(message, options);
	}

	mountTokensBackRecursively(message: { html: string; tokens?: Token[] }, tokenList: Token[], useHtml = true) {
		const missingTokens = [];

		if (tokenList.length > 0) {
			for (const { token, text, noHtml } of tokenList) {
				if (message.html.indexOf(token) >= 0) {
					message.html = message.html.replace(token, () => (useHtml ? text : (noHtml ?? ''))); // Uses lambda so doesn't need to escape $
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

	mountTokensBack<TMessage extends { html: string; tokens?: Token[] }>(message: TMessage, useHtml = true) {
		if (message.tokens) {
			this.mountTokensBackRecursively(message, message.tokens, useHtml);
		}

		return message;
	}

	code<TMessage extends { html: string; tokens?: Token[] }>(message: TMessage) {
		return code(message);
	}

	filterMarkdownFromMessage(message: string) {
		return filtered(message);
	}
}

export const Markdown = new MarkdownClass();

export const filterMarkdown = (message: string) => Markdown.filterMarkdownFromMessage(message);

export const createMarkdownMessageRenderer =
	({ ...options }) =>
	(message: { html: string; tokens?: Token[] }) => {
		if (!message?.html?.trim()) {
			return message;
		}

		return original(message, options);
	};

export const createMarkdownNotificationRenderer = () => (message: string) => filtered(message);
