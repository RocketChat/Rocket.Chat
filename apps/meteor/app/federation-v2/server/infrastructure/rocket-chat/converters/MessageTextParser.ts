import sanitizeHtml from 'sanitize-html';

import { FederatedUser } from '../../../domain/FederatedUser';

interface IInternalMention {
	mention: string;
	realName: string;
}

const getAllMentionsWithTheirRealNames = (message: string, homeServerDomain: string): IInternalMention[] => {
	const mentions: IInternalMention[] = [];
	sanitizeHtml(message, {
		allowedTags: ['a'],
		exclusiveFilter: (frame): boolean => {
			const {
				attribs: { href = '' },
				tag,
				text,
			} = frame;
			if (tag !== 'a' || !href || !text) {
				return false;
			}
			const isUsernameMention = href.includes('https://matrix.to/#/') && href.includes('@');
			if (isUsernameMention) {
				const [, username] = href.split('@');
				const [, serverDomain] = username.split(':');

				const withoutServerIdentification = `@${username.split(':').shift()}`;
				const fullUsername = `@${username}`;

				mentions.push({
					mention: FederatedUser.isOriginalFromTheProxyServer(serverDomain, homeServerDomain) ? withoutServerIdentification : fullUsername,
					realName: text,
				});
			}
			const isAllMention = href.includes('https://matrix.to/#/') && !href.includes('@');
			if (isAllMention) {
				mentions.push({
					mention: '@all',
					realName: text,
				});
			}
			return false;
		},
	});

	return mentions;
};

export const toInternalMessageFormat = ({
	rawMessage,
	formattedMessage,
	homeServerDomain,
}: {
	rawMessage: string;
	formattedMessage: string;
	homeServerDomain: string;
}): string => replaceAllMentionsInTheirProperPosition(rawMessage, getAllMentionsWithTheirRealNames(formattedMessage, homeServerDomain));

const replaceAllMentionsInTheirProperPosition = (message: string, allMentionsWithRealNames: IInternalMention[]): string =>
	allMentionsWithRealNames.reduce((acc, { mention, realName }) => acc.replace(realName, mention), message).trim();

export const toInternalQuoteMessageFormat = async ({
	homeServerDomain,
	formattedMessage,
	messageToReplyToUrl,
}: {
	messageToReplyToUrl: string;
	formattedMessage: string;
	rawMessage: string;
	homeServerDomain: string;
}): Promise<string> => {
	const withMentionsOnly = sanitizeHtml(formattedMessage, {
		allowedTags: ['a'],
		allowedAttributes: {
			a: ['href'],
		},
		nonTextTags: ['mx-reply', 'blockquote'],
	});
	const withNoHtmlAtAll = sanitizeHtml(withMentionsOnly, {
		allowedTags: [],
		allowedAttributes: {},
	});
	return `[ ](${messageToReplyToUrl}) ${replaceAllMentionsInTheirProperPosition(
		withNoHtmlAtAll,
		getAllMentionsWithTheirRealNames(withMentionsOnly, homeServerDomain),
	)}`;
};
