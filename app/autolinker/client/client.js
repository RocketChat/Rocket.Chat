import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Autolinker from 'autolinker';

import { escapeRegExp } from '../../../lib/escapeRegExp';

export const createAutolinkerMessageRenderer = (config) =>
	(message) => {
		if (!message.html?.trim()) {
			return message;
		}

		let msgParts;
		let regexTokens;
		if (message.tokens && message.tokens.length) {
			regexTokens = new RegExp(`(${ (message.tokens || []).map(({ token }) => escapeRegExp(token)) })`, 'g');
			msgParts = message.html.split(regexTokens);
		} else {
			msgParts = [message.html];
		}

		message.html = msgParts
			.map((msgPart) => {
				if (regexTokens && regexTokens.test(msgPart)) {
					return msgPart;
				}
				return Autolinker.link(msgPart, {
					...config,
					stripTrailingSlash: false,
					replaceFn: (match) => {
						const token = `=!=${ Random.id() }=!=`;
						const tag = match.buildTag();

						if (~match.matchedText.indexOf(Meteor.absoluteUrl())) {
							tag.setAttr('target', '');
						}

						message.tokens = message.tokens ?? [];
						message.tokens.push({
							token,
							text: tag.toAnchorString(),
						});
						return token;
					} });
			})
			.join('');

		return message;
	};
