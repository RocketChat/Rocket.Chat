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

const markdown = (message) => {
	const parser = RocketChat.settings.get('Markdown_Parser');
	if (typeof parsers[parser] === 'function') {
		return parsers[parser](message);
	}
	return parsers['original'](message);
};

RocketChat.markdown = markdown;
RocketChat.callbacks.add('renderMessage', markdown, RocketChat.callbacks.priority.HIGH, 'markdown');

if (Meteor.isClient) {
	Blaze.registerHelper('RocketChatMarkdown', (text) => {
		return RocketChat.markdown(text);
	});
}
