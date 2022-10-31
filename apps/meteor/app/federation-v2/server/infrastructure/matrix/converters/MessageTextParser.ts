import type { MentionPill as MentionPillType } from '@rocket.chat/forked-matrix-bot-sdk';

const INTERNAL_MENTIONS_FOR_EXTERNAL_USERS_REGEX = new RegExp(`@([0-9a-zA-Z-_.]+(@([0-9a-zA-Z-_.]+))?):+([0-9a-zA-Z-_.]+)`, 'gm'); // @username:server.com
const INTERNAL_MENTIONS_FOR_INTERNAL_USERS_REGEX = new RegExp(`@([0-9a-zA-Z-_.]+(@([0-9a-zA-Z-_.]+))?)$`, 'gm'); // @username, @username.name
const INTERNAL_GENERAL_REGEX = /(@all)|(@here)/gm;

const replaceInternalUserMentionsForExternal = async (message: string): Promise<string> => {
	const { MentionPill } = await import('@rocket.chat/forked-matrix-bot-sdk');
	const promises: Promise<MentionPillType>[] = [];

	message
		.split(' ')
		.forEach((word) =>
			word.replace(INTERNAL_MENTIONS_FOR_EXTERNAL_USERS_REGEX, (match): any => promises.push(MentionPill.forUser(match.trimStart()))),
		);

	const externalUserMentions = await Promise.all(promises);

	return message
		.split(' ')
		.map((word) => word.replace(INTERNAL_MENTIONS_FOR_EXTERNAL_USERS_REGEX, () => ` ${externalUserMentions.shift()?.html}`))
		.join(' ');
};

const replaceInternalUserExternalMentionsForExternal = async (message: string, homeServerDomain: string): Promise<string> => {
	const { MentionPill } = await import('@rocket.chat/forked-matrix-bot-sdk');
	const promises: Promise<MentionPillType>[] = [];

	message
		.split(' ')
		.forEach((word) =>
			word.replace(INTERNAL_MENTIONS_FOR_INTERNAL_USERS_REGEX, (match): any =>
				promises.push(MentionPill.forUser(`${match.trimStart()}:${homeServerDomain}`)),
			),
		);

	const externalUserMentions = await Promise.all(promises);

	return message
		.split(' ')
		.map((word) => word.replace(INTERNAL_MENTIONS_FOR_INTERNAL_USERS_REGEX, () => ` ${externalUserMentions.shift()?.html}`))
		.join(' ');
};

const replaceInternalGeneralMentionsForExternal = async (message: string, externalRoomId: string): Promise<string> => {
	const { MentionPill } = await import('@rocket.chat/forked-matrix-bot-sdk');
	const promises: Promise<MentionPillType>[] = [];

	message.replace(INTERNAL_GENERAL_REGEX, (): any => promises.push(MentionPill.forRoom(externalRoomId)));

	const externalMentions = await Promise.all(promises);

	return message.replace(INTERNAL_GENERAL_REGEX, () => ` ${externalMentions.shift()?.html}`);
};

const removeAllExtraBlankSpacesForASingleOne = (message: string): string => message.replace(/\s+/g, ' ').trim();

const replaceInternalWithExternalMentions = async (message: string, externalRoomId: string, homeServerDomain: string): Promise<string> =>
	removeAllExtraBlankSpacesForASingleOne(
		await replaceInternalUserExternalMentionsForExternal(
			await replaceInternalUserMentionsForExternal(await replaceInternalGeneralMentionsForExternal(message, externalRoomId)),
			homeServerDomain,
		),
	);

const removeMarkdownFromMessage = (message: string): string => message.replace(/\[(.*?)\]\(.*?\)/g, '').trim();

export const toExternalMessageFormat = async ({
	externalRoomId,
	homeServerDomain,
	message,
}: {
	message: string;
	externalRoomId: string;
	homeServerDomain: string;
}): Promise<string> => replaceInternalWithExternalMentions(removeMarkdownFromMessage(message), externalRoomId, homeServerDomain);

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

	const formattedMessage = removeMarkdownFromMessage(message);

	const { body, formatted_body: formattedBody } = RichReply.createFor(
		externalRoomId,
		{ event_id: eventToReplyTo, sender: originalEventSender },
		formattedMessage,
		await toExternalMessageFormat({
			message: formattedMessage,
			externalRoomId,
			homeServerDomain,
		}),
	);

	return {
		message: body,
		formattedMessage: formattedBody,
	};
};
