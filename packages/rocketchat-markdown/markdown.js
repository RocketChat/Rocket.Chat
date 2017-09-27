/*
 * Markdown is a named function that will parse markdown syntax
 * @param {Object} message - The message object
 */
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
			html: _.escapeHTML(text)
		};
		return this.parseMessageNotEscaped(message).html;
	}

	parseNotEscaped(text) {
		const message = {
			html: text
		};
		return this.parseMessageNotEscaped(message).html;
	}

	parseMessageNotEscaped(message) {
		const parser = RocketChat.settings.get('Markdown_Parser');
		if (typeof parsers[parser] === 'function') {
			return parsers[parser](message);
		}
		return parsers['original'](message);
	}
}

const Markdown = new MarkdownClass;
RocketChat.Markdown = Markdown;

// renderMessage already did html escape
const MarkdownMessage = (message) => {
	if (_.trim(message != null ? message.html : undefined)) {
		message = Markdown.parseMessageNotEscaped(message);
	}

	return message;
};

RocketChat.callbacks.add('renderMessage', MarkdownMessage, RocketChat.callbacks.priority.HIGH, 'markdown');

if (Meteor.isClient) {
	Blaze.registerHelper('RocketChatMarkdown', text => Markdown.parse(text));
	Blaze.registerHelper('RocketChatMarkdownUnescape', text => Markdown.parseNotEscaped(text));
}
