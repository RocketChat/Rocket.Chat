import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import s from 'underscore.string';
import Autolinker from 'autolinker';

import { settings } from '../../settings';
import { callbacks } from '../../callbacks';

const createAutolinker = () => {
	const regUrls = new RegExp(settings.get('AutoLinker_UrlsRegExp'));

	const replaceAutolinkerMatch = (match) => {
		if (match.getType() !== 'url') {
			return null;
		}

		if (!regUrls.test(match.matchedText)) {
			return null;
		}

		if (match.matchedText.indexOf(Meteor.absoluteUrl()) === 0) {
			const tag = match.buildTag();
			tag.setAttr('target', '');
			return tag;
		}

		return true;
	};

	return new Autolinker({
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
		replaceFn: replaceAutolinkerMatch,
	});
};

let autolinker;

Tracker.autorun(() => {
	autolinker = createAutolinker();
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

			return autolinker.link(msgPart);
		})
		.join('');

	return message;
};

Tracker.autorun(function() {
	if (settings.get('AutoLinker') !== true) {
		return callbacks.remove('renderMessage', 'autolinker');
	}
	callbacks.add('renderMessage', renderMessage, callbacks.priority.LOW, 'autolinker');
});
