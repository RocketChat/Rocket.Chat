import sanitizeHtml from 'sanitize-html';
import type { IFrame } from 'sanitize-html';

import { FederatedUser } from '../../../domain/FederatedUser';

interface IInternalMention {
	mention: string;
	realName: string;
}

const DEFAULT_LINK_FOR_MATRIX_MENTIONS = 'https://matrix.to/#/';
const DEFAULT_TAGS_FOR_MATRIX_QUOTES = ['mx-reply', 'blockquote'];

const getAllMentionsWithTheirRealNames = (message: string, homeServerDomain: string, senderExternalId: string): IInternalMention[] => {
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
				const isMentioningHimself = senderExternalId === text;

				mentions.push({
					mention: FederatedUser.isOriginalFromTheProxyServer(serverDomain, homeServerDomain) ? withoutServerIdentification : fullUsername,
					realName: isMentioningHimself ? withoutServerIdentification : text,
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
	senderExternalId,
}: {
	rawMessage: string;
	formattedMessage: string;
	homeServerDomain: string;
	senderExternalId: string;
}): string =>
	replaceAllMentionsOneByOneSequentially(
		rawMessage,
		getAllMentionsWithTheirRealNames(formattedMessage, homeServerDomain, senderExternalId),
	);

const MATCH_ANYTHING = 'w';
const replaceAllMentionsOneByOneSequentially = (message: string, allMentionsWithRealNames: IInternalMention[]): string => {
	let parsedMessage = '';
	let toCompareAgain = message;

	if (allMentionsWithRealNames.length === 0) {
		return message;
	}

	allMentionsWithRealNames.forEach(({ mention, realName }, mentionsIndex) => {
		const negativeLookAhead = `(?!${MATCH_ANYTHING})`;
		const realNameRegex = new RegExp(`(?<!w)${realName}${negativeLookAhead}`);
		let realNamePosition = toCompareAgain.search(realNameRegex);
		const realNamePresentInMessage = realNamePosition !== -1;
		let messageReplacedWithMention = realNamePresentInMessage ? toCompareAgain.replace(realNameRegex, mention) : '';
		let positionRemovingLastMention = realNamePresentInMessage ? realNamePosition + realName.length + 1 : -1;
		const mentionForRoom = realName.charAt(0) === '!';
		if (!realNamePresentInMessage && mentionForRoom) {
			const allMention = '@all';
			const defaultRegexForRooms = new RegExp(`(?<!w)${allMention}${negativeLookAhead}`);
			realNamePosition = toCompareAgain.search(defaultRegexForRooms);
			messageReplacedWithMention = toCompareAgain.replace(defaultRegexForRooms, mention);
			positionRemovingLastMention = realNamePosition + allMention.length + 1;
		}
		const lastItem = allMentionsWithRealNames.length - 1;
		const lastMentionToProcess = mentionsIndex === lastItem;
		const lastMentionPosition = realNamePosition + mention.length + 1;

		toCompareAgain = toCompareAgain.slice(positionRemovingLastMention);
		parsedMessage += messageReplacedWithMention.slice(0, lastMentionToProcess ? undefined : lastMentionPosition);
	});

	return parsedMessage.trim();
};

function stripReplyQuote(message: string): string {
	const splitLines = message.split(/\r?\n/);

	// Find which line the quote ends on
	let splitLineIndex = 0;
	for (const line of splitLines) {
		if (line[0] !== '>') {
			break;
		}
		splitLineIndex += 1;
	}

	return splitLines.splice(splitLineIndex).join('\n').trim();
}

export const toInternalQuoteMessageFormat = async ({
	homeServerDomain,
	formattedMessage,
	rawMessage,
	messageToReplyToUrl,
	senderExternalId,
}: {
	messageToReplyToUrl: string;
	formattedMessage: string;
	rawMessage: string;
	homeServerDomain: string;
	senderExternalId: string;
}): Promise<string> => {
	const withMentionsOnly = sanitizeHtml(formattedMessage, {
		allowedTags: ['a'],
		allowedAttributes: {
			a: ['href'],
		},
		nonTextTags: DEFAULT_TAGS_FOR_MATRIX_QUOTES,
	});
	const rawMessageWithoutMatrixQuotingFormatting = stripReplyQuote(rawMessage);

	return `[ ](${messageToReplyToUrl}) ${replaceAllMentionsOneByOneSequentially(
		rawMessageWithoutMatrixQuotingFormatting,
		getAllMentionsWithTheirRealNames(withMentionsOnly, homeServerDomain, senderExternalId),
	)}`;
};
