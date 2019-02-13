import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { RocketChat } from 'meteor/rocketchat:lib';
import Autolinker from 'autolinker';

const createAutolinker = () => {
	const regUrls = new RegExp(RocketChat.settings.get('AutoLinker_UrlsRegExp'));

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
		stripPrefix: RocketChat.settings.get('AutoLinker_StripPrefix'),
		urls: {
			schemeMatches: RocketChat.settings.get('AutoLinker_Urls_Scheme'),
			wwwMatches: RocketChat.settings.get('AutoLinker_Urls_www'),
			tldMatches: RocketChat.settings.get('AutoLinker_Urls_TLD'),
		},
		email: RocketChat.settings.get('AutoLinker_Email'),
		phone: RocketChat.settings.get('AutoLinker_Phone'),
		twitter: false,
		stripTrailingSlash: false,
		replaceFn: replaceAutolinkerMatch,
	});
};

const renderMessage = (message) => {
	if (RocketChat.settings.get('AutoLinker') !== true) {
		return message;
	}

	if (!s.trim(message.html)) {
		return message;
	}

	const regexTokens = new RegExp(`(${ (message.tokens || []).map(({ token }) => RegExp.escape(token)) })`, 'g');

	const autolinker = createAutolinker();
	message.html = message.html.split(regexTokens)
		.map((msgPart) => {
			if (regexTokens.test(msgPart)) {
				return msgPart;
			}

			return autolinker.link(msgPart);
		})
		.join('');

	return message;
};

RocketChat.callbacks.add('renderMessage', renderMessage, RocketChat.callbacks.priority.LOW, 'autolinker');
