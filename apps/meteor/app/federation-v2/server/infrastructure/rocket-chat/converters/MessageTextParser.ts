import sanitizeHtml from 'sanitize-html';
import type { IFrame } from 'sanitize-html';

import { FederatedUser } from '../../../domain/FederatedUser';

interface IInternalMention {
	mention: string;
	realName: string;
}

const DEFAULT_LINK_FOR_MATRIX_MENTIONS = 'https://matrix.to/#/';
const DEFAULT_TAGS_FOR_MATRIX_QUOTES = ['mx-reply', 'blockquote'];
const DEFAULT_QUOTES_SYMBOLS_FOR_MATRIX_IN_RAW_TEXT = /^>.*/; // > text

const getAllMentionsWithTheirRealNames = (message: string, homeServerDomain: string): IInternalMention[] => {
	const mentions: IInternalMention[] = [];
	sanitizeHtml(message, {
		allowedTags: ['a'],
		exclusiveFilter: (frame: IFrame): boolean => {
			const {
				attribs: { href = '' },
				tag,
				text,
			} = frame;
			const validATag = tag === 'a' && href && text;
			if (!validATag) {
				return false;
			}
			const isUsernameMention = href.includes(DEFAULT_LINK_FOR_MATRIX_MENTIONS) && href.includes('@');
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
			const isMentioningAll = href.includes(DEFAULT_LINK_FOR_MATRIX_MENTIONS) && !href.includes('@');
			if (isMentioningAll) {
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
}): string => replaceAllMentionsOneByOneSequentially(rawMessage, getAllMentionsWithTheirRealNames(formattedMessage, homeServerDomain));

const replaceAllMentionsOneByOneSequentially = (message: string, allMentionsWithRealNames: IInternalMention[]): string =>
	allMentionsWithRealNames.reduce((acc, { mention, realName }) => acc.replace(realName, mention), message || '').trim();

export const toInternalQuoteMessageFormat = async ({
	homeServerDomain,
	formattedMessage,
	rawMessage,
	messageToReplyToUrl,
}: {
	messageToReplyToUrl: string;
	formattedMessage: string;
	rawMessage: string;
	homeServerDomain: string;
}): Promise<string> => {
	if (!rawMessage || !formattedMessage) {
		return '';
	}
	const withMentionsOnly = sanitizeHtml(formattedMessage, {
		allowedTags: ['a'],
		allowedAttributes: {
			a: ['href'],
		},
		nonTextTags: DEFAULT_TAGS_FOR_MATRIX_QUOTES,
	});
	const rawMessageWithoutMatrixQuotingFormatting = rawMessage.replace(DEFAULT_QUOTES_SYMBOLS_FOR_MATRIX_IN_RAW_TEXT, '');
	return `[ ](${messageToReplyToUrl}) ${replaceAllMentionsOneByOneSequentially(
		rawMessageWithoutMatrixQuotingFormatting,
		getAllMentionsWithTheirRealNames(withMentionsOnly, homeServerDomain),
	)}`;
};
