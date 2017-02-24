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
	marked,
};

const Markdown = (message) => {
	const parser = RocketChat.settings.get('Markdown_Parser');
	if (typeof parsers[parser] === 'function') {
		return parsers[parser](message);
	}
	return parsers['original'](message);
};

RocketChat.Markdown = Markdown;
RocketChat.callbacks.add('renderMessage', Markdown, RocketChat.callbacks.priority.HIGH, 'markdown');

if (Meteor.isClient) {
	Blaze.registerHelper('RocketChatMarkdown', (text) => {
		return RocketChat.Markdown(text);
	});
}
