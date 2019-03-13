import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { settings } from '/app/settings';
import { callbacks } from '/app/callbacks';
import Autolinker from 'autolinker';

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

const renderMessage = (message) => {
	if (settings.get('AutoLinker') !== true) {
		return message;
	}

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
	const autolinker = createAutolinker();
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

callbacks.add('renderMessage', renderMessage, callbacks.priority.LOW, 'autolinker');
