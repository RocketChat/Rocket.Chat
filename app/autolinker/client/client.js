import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Tracker } from 'meteor/tracker';
import s from 'underscore.string';
import Autolinker from 'autolinker';


import { settings } from '../../settings';
import { callbacks } from '../../callbacks';
import { escapeRegExp } from '../../../lib/escapeRegExp';

const createAutolinkerMessageRenderer = (config) =>
	(message) => {
		if (!s.trim(message.html)) {
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

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('AutoLinker') === true;

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'autolinker');
			return;
		}

		const renderMessage = createAutolinkerMessageRenderer({
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
		});

		callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'autolinker');
	});
});
