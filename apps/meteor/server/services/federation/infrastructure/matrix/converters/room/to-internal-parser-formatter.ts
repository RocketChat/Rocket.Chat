import type { MentionPill as MentionPillType } from '@rocket.chat/forked-matrix-bot-sdk';
import { marked } from 'marked';

const INTERNAL_MENTIONS_FOR_EXTERNAL_USERS_REGEX = /@([0-9a-zA-Z-_.]+(@([0-9a-zA-Z-_.]+))?):+([0-9a-zA-Z-_.]+)(?=[^<>]*(?:<\w|$))/gm; // @username:server.com excluding any <a> tags
const INTERNAL_MENTIONS_FOR_INTERNAL_USERS_REGEX = /(?:^|(?<=\s))@([0-9a-zA-Z-_.]+(@([0-9a-zA-Z-_.]+))?)(?=[^<>]*(?:<\w|$))/gm; // @username, @username.name excluding any <a> tags and emails
const INTERNAL_GENERAL_REGEX = /(@all)|(@here)/gm;

const replaceMessageMentions = async (
	message: string,
	mentionRegex: RegExp,
	parseMatchFn: (match: string) => Promise<MentionPillType>,
): Promise<string> => {
	const promises: Promise<MentionPillType>[] = [];

	message.replace(mentionRegex, (match: string): any => promises.push(parseMatchFn(match)));

	const mentions = await Promise.all(promises);

	return message.replace(mentionRegex, () => ` ${mentions.shift()?.html}`);
};

const replaceMentionsFromLocalExternalUsersForExternalFormat = async (message: string): Promise<string> => {
	const { MentionPill } = await import('@rocket.chat/forked-matrix-bot-sdk');

	return replaceMessageMentions(message, INTERNAL_MENTIONS_FOR_EXTERNAL_USERS_REGEX, (match: string) =>
		MentionPill.forUser(match.trimStart()),
	);
};

const replaceInternalUsersMentionsForExternalFormat = async (message: string, homeServerDomain: string): Promise<string> => {
	const { MentionPill } = await import('@rocket.chat/forked-matrix-bot-sdk');

	return replaceMessageMentions(message, INTERNAL_MENTIONS_FOR_INTERNAL_USERS_REGEX, (match: string) =>
		MentionPill.forUser(`${match.trimStart()}:${homeServerDomain}`),
	);
};

const replaceInternalGeneralMentionsForExternalFormat = async (message: string, externalRoomId: string): Promise<string> => {
	const { MentionPill } = await import('@rocket.chat/forked-matrix-bot-sdk');

	return replaceMessageMentions(message, INTERNAL_GENERAL_REGEX, () => MentionPill.forRoom(externalRoomId));
};

const removeAllExtraBlankSpacesForASingleOne = (message: string): string => message.replace(/\s+/g, ' ').trim();

const replaceInternalWithExternalMentions = async (message: string, externalRoomId: string, homeServerDomain: string): Promise<string> =>
	replaceInternalUsersMentionsForExternalFormat(
		await replaceMentionsFromLocalExternalUsersForExternalFormat(
			await replaceInternalGeneralMentionsForExternalFormat(message, externalRoomId),
		),
		homeServerDomain,
	);

const convertMarkdownToHTML = (message: string): string => marked.parse(message);

export const toExternalMessageFormat = async ({
	externalRoomId,
	homeServerDomain,
	message,
}: {
	message: string;
	externalRoomId: string;
	homeServerDomain: string;
}): Promise<string> =>
	removeAllExtraBlankSpacesForASingleOne(
		convertMarkdownToHTML((await replaceInternalWithExternalMentions(message, externalRoomId, homeServerDomain)).trim()),
	);

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
	const { RichReply } = await import('@rocket.chat/forked-matrix-bot-sdk');

	const formattedMessage = convertMarkdownToHTML(message);
	const finalFormattedMessage = convertMarkdownToHTML(
		await toExternalMessageFormat({
			message,
			externalRoomId,
			homeServerDomain,
		}),
	);

	const { formatted_body: formattedBody } = RichReply.createFor(
		externalRoomId,
		{ event_id: eventToReplyTo, sender: originalEventSender },
		formattedMessage,
		finalFormattedMessage,
	);
	const { body } = RichReply.createFor(
		externalRoomId,
		{ event_id: eventToReplyTo, sender: originalEventSender },
		message,
		finalFormattedMessage,
	);

	return {
		message: body,
		formattedMessage: formattedBody,
	};
};
