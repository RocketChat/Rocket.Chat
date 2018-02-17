/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
import s from 'underscore.string';
import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { RocketChat } from 'meteor/rocketchat:lib';

import { marked } from './parser/marked/marked.js';
import { original } from './parser/original/original.js';

const parsers = {
	original,
	marked
};

class MarkdownClass {
	parse(text) {
		const message = {
			html: s.escapeHTML(text)
		};
		return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
	}

	parseNotEscaped(text) {
		const message = {
			html: text
		};
		return this.mountTokensBack(this.parseMessageNotEscaped(message)).html;
	}

	parseMessageNotEscaped(message) {
		const parser = RocketChat.settings.get('Markdown_Parser');

		if (parser === 'disabled') {
			return message;
		}

		if (typeof parsers[parser] === 'function') {
			return parsers[parser](message);
		}
		return parsers['original'](message);
	}

	mountTokensBack(message) {
		if (message.tokens && message.tokens.length > 0) {
			for (const {token, text} of message.tokens) {
				message.html = message.html.replace(token, () => text); // Uses lambda so doesn't need to escape $
			}
		}

		return message;
	}
}

const Markdown = new MarkdownClass;
RocketChat.Markdown = Markdown;

// renderMessage already did html escape
const MarkdownMessage = (message) => {
	if (s.trim(message != null ? message.html : undefined)) {
		message = Markdown.parseMessageNotEscaped(message);
	}

	return message;
};

RocketChat.callbacks.add('renderMessage', MarkdownMessage, RocketChat.callbacks.priority.HIGH, 'markdown');

if (Meteor.isClient) {
	Blaze.registerHelper('RocketChatMarkdown', text => Markdown.parse(text));
	Blaze.registerHelper('RocketChatMarkdownUnescape', text => Markdown.parseNotEscaped(text));
}
