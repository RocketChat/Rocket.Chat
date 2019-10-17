import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Tracker } from 'meteor/tracker';
import s from 'underscore.string';
import Autolinker from 'autolinker';


import { settings } from '../../settings';
import { callbacks } from '../../callbacks';

let config;

Tracker.autorun(function() {
	config = {
		stripPrefix: settings.get('AutoLinker_StripPrefix'),
		urls: {
			schemeMatches: settings.get('AutoLinker_Urls_Scheme'),
			wwwMatches: settings.get('AutoLinker_Urls_www'),
			tldMatches: settings.get('AutoLinker_Urls_TLD'),
		},
		email: settings.get('AutoLinker_Email'),
		phone: settings.get('AutoLinker_Phone'),
		twitter: false,
		stripTrailingSlash: false,
	};
});

const renderMessage = (message) => {
	if (!s.trim(message.html)) {
		return message;
	}

	let msgParts;
	let regexTokens;
	if (message.tokens && message.tokens.length) {
		regexTokens = new RegExp(`(${ (message.tokens || []).map(({ token }) => RegExp.escape(token)) })`, 'g');
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
				replaceFn: (match) => {
					const token = `=!=${ Random.id() }=!=`;
					const tag = match.buildTag();

					if (~match.matchedText.indexOf(Meteor.absoluteUrl())) {
						tag.setAttr('target', '');
					}

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

Tracker.autorun(function() {
	if (settings.get('AutoLinker') !== true) {
		return callbacks.remove('renderMessage', 'autolinker');
	}

	callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'autolinker');
});
