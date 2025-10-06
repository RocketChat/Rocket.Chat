import type { EventID, HomeserverEventSignatures } from '@rocket.chat/federation-sdk';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

type MatrixMessageContent = HomeserverEventSignatures['homeserver.matrix.message']['content'] & { format?: string };

type MatrixEvent = {
	content?: { body?: string; formatted_body?: string };
	event_id: string;
	sender: string;
};

const MATRIX_TO_URL = 'https://matrix.to/#/';
const MATRIX_QUOTE_TAGS = ['mx-reply', 'blockquote'];
const REGEX = {
	anchor: /<a\s+(?:[^>]*?\s+)?href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi,
	externalUsers: /@([0-9a-zA-Z-_.]+(@([0-9a-zA-Z-_.]+))?):+([0-9a-zA-Z-_.]+)(?=[^<>]*(?:<\w|$))/gm,
	internalUsers: /(?:^|(?<=\s))@([0-9a-zA-Z-_.]+(@([0-9a-zA-Z-_.]+))?)(?=[^<>]*(?:<\w|$))/gm,
	general: /(@all)|(@here)/gm,
};

const escapeHtml = (text: string): string =>
	text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] || c);

const stripHtml = (html: string, keep: string[] = []): string => sanitizeHtml(html, { allowedTags: keep.includes('a') ? ['a'] : [] });

const createMentionHtml = (id: string): string => `<a href="${MATRIX_TO_URL}${id}">${id}</a>`;

const extractAnchors = (html: string) => Array.from(html.matchAll(REGEX.anchor), ([, href, text]) => ({ href, text }));

const extractMentions = (html: string, homeServerDomain: string, senderExternalId: string) =>
	extractAnchors(html)
		.filter(({ href, text }) => href?.includes(MATRIX_TO_URL) && text)
		.map(({ href, text }) => {
			if (href.includes('@')) {
				const [, username] = href.split('@');
				const [, serverDomain] = username.split(':');
				const localUsername = `@${username.split(':')[0]}`;
				return {
					mention: serverDomain === homeServerDomain ? localUsername : `@${username}`,
					realName: senderExternalId === text ? localUsername : text,
				};
			}
			return { mention: '@all', realName: text };
		});

const replaceMentions = (message: string, mentions: Array<{ mention: string; realName: string }>): string => {
	if (!mentions.length) return message;

	let result = message;
	for (const { mention, realName } of mentions) {
		const regex = new RegExp(`(?<!\\w)${realName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\w)`);
		if (result.includes(realName)) {
			result = result.replace(regex, mention);
		} else if (realName.startsWith('!')) {
			result = result.replace(/(?<!\w)@all(?!\w)/, mention);
		}
	}
	return result.trim();
};

const replaceWithMentionPills = async (message: string, regex: RegExp, createPill: (match: string) => string): Promise<string> => {
	const matches = Array.from(message.matchAll(regex), ([match]) => createPill(match.trimStart()));
	let i = 0;
	return message.replace(regex, () => ` ${matches[i++]}`);
};

const stripQuotePrefix = (message: string): string => {
	const lines = message.split(/\r?\n/);
	const index = lines.findIndex((l) => !l.startsWith('>'));
	return lines
		.slice(index === -1 ? lines.length : index)
		.join('\n')
		.trim();
};

const createReplyContent = (roomId: string, event: MatrixEvent, textBody: string, htmlBody: string): MatrixMessageContent => {
	const body = event.content?.body || '';
	const html = event.content?.formatted_body || escapeHtml(body);
	const quote = `> <${event.sender}> ${body.split('\n').join('\n> ')}`;
	const htmlQuote =
		`<mx-reply><blockquote>` +
		`<a href="${MATRIX_TO_URL}${roomId}/${event.event_id}">In reply to</a> ` +
		`<a href="${MATRIX_TO_URL}${event.sender}">${event.sender}</a><br />${html}` +
		`</blockquote></mx-reply>`;

	return {
		'm.relates_to': { 'm.in_reply_to': { event_id: event.event_id as EventID } },
		'msgtype': 'm.text',
		'body': `${quote}\n\n${textBody}`,
		'format': 'org.matrix.custom.html',
		'formatted_body': `${htmlQuote}${htmlBody}`,
	};
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
}): string => replaceMentions(rawMessage, extractMentions(formattedMessage, homeServerDomain, senderExternalId));

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
	let cleaned = formattedMessage;
	MATRIX_QUOTE_TAGS.forEach((tag) => {
		cleaned = cleaned.replace(new RegExp(`<${tag}[^>]*>.*?</${tag}>`, 'gis'), '');
	});
	cleaned = stripHtml(cleaned, ['a']);

	return `[ ](${messageToReplyToUrl}) ${replaceMentions(stripQuotePrefix(rawMessage), extractMentions(cleaned, homeServerDomain, senderExternalId))}`;
};

export const toExternalMessageFormat = async ({
	externalRoomId,
	homeServerDomain,
	message,
}: {
	message: string;
	externalRoomId: string;
	homeServerDomain: string;
}): Promise<string> => {
	let result = message;
	result = await replaceWithMentionPills(result, REGEX.general, () => createMentionHtml(externalRoomId));
	result = await replaceWithMentionPills(result, REGEX.externalUsers, (match) => createMentionHtml(match));
	result = await replaceWithMentionPills(result, REGEX.internalUsers, (match) => createMentionHtml(`${match}:${homeServerDomain}`));

	return (await marked.parse(result.trim())).replace(/\s+/g, ' ').trim();
};

export const toExternalQuoteMessageFormat = async ({
	message,
	eventToReplyTo,
	externalRoomId,
	homeServerDomain,
	originalEventSender,
}: {
	externalRoomId: string;
	eventToReplyTo: string;
	originalEventSender: string;
	message: string;
	homeServerDomain: string;
}): Promise<{ message: string; formattedMessage: string }> => {
	const event = { event_id: eventToReplyTo, sender: originalEventSender, content: {} };
	const markdownHtml = await marked.parse(message);
	const withMentions = await toExternalMessageFormat({ message, externalRoomId, homeServerDomain });
	const withMentionsHtml = await marked.parse(withMentions);

	const reply1 = createReplyContent(externalRoomId, event, markdownHtml, withMentionsHtml);
	const reply2 = createReplyContent(externalRoomId, event, message, withMentionsHtml);

	return {
		message: reply2.body,
		formattedMessage: reply1.formatted_body ?? '',
	};
};
