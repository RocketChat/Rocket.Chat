import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import Autolinker from 'autolinker';
import { escapeRegExp } from '@rocket.chat/string-helpers';

export const createAutolinkerMessageRenderer =
	({ phone, ...config }) =>
	(message) => {
		if (!message.html?.trim()) {
			return message;
		}

		let msgParts;
		let regexTokens;
		if (message.tokens && message.tokens.length) {
			regexTokens = new RegExp(`(${(message.tokens || []).map(({ token }) => escapeRegExp(token))})`, 'g');
			msgParts = message.html.split(regexTokens);
		} else {
			msgParts = [message.html];
		}

		message.html = msgParts
			.map((msgPart) => {
				if (regexTokens && regexTokens.test(msgPart)) {
					return msgPart;
				}

				const muttableConfig = {
					...config,
					phone: false,
					stripTrailingSlash: false,
					replaceFn: (match) => {
						const token = `=!=${Random.id()}=!=`;
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
					},
				};

				const autolinkerMsg = Autolinker.link(msgPart, muttableConfig);

				muttableConfig.phone = phone;

				return phone ? Autolinker.link(autolinkerMsg, muttableConfig) : autolinkerMsg;
			})
			.join('');

		return message;
	};
