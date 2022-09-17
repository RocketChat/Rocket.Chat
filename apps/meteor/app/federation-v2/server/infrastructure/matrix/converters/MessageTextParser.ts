import type { MentionPill as MentionPillType } from '@rocket.chat/forked-matrix-bot-sdk';

import { FederatedUser } from '../../../domain/FederatedUser';

const A_HREF_LINKS_REGEX = /href="(.*?)"/gm; // '<a => href="https://matrix.to/#/@user:server.com" <= >user</a>
const HREF_REGEX = /href=/; // href="https://matrix.to/#/@user:server.com"
const A_LINKS_REGEX = /<a [^>]+>([^<]+)<\/a>/gm; // <a href="https://matrix.to/#/@user:server.com">user</a>
const SPACES_REGEX = /\ /g;
const MATRIX_MENTION_LINK_REGEX = /\[(https?:\/\/(.+?.)?matrix.to(\/[A-Za-z0-9-._~:/?#[@!$&'()*+,;=]*)?)\]/gm; // [https://matrix.to/#/@marcos.defendi:b.rc.allskar.com]
const INTERNAL_MENTIONS_FOR_EXTERNAL_USERS_REGEX = new RegExp(`@([0-9a-zA-Z-_.]+(@([0-9a-zA-Z-_.]+))?):+([0-9a-zA-Z-_.]+)`, 'gm'); // @username:server.com
const INTERNAL_MENTIONS_FOR_INTERNAL_USERS_REGEX = new RegExp(`@([0-9a-zA-Z-_.]+(@([0-9a-zA-Z-_.]+))?)$`, 'gm'); // @username, @username.name
const INTERNAL_GENERAL_REGEX = /(@all)|(@here)/gm;

// return links in the following format: [mentionLink]
const extractAllMentionsLinksFromMessage = (message: string): string[] => {
	const mentionLinks: string[] = [];
	message.replace(A_HREF_LINKS_REGEX, (match): any => {
		const mentionLink = match.replace(HREF_REGEX, '').replace(/\"/g, '');
		mentionLinks.push(`[${mentionLink}]`);
	});

	return mentionLinks;
};

const replaceExternalWithInternalMentions = (message: string, homeServerDomain: string): string => {
	const allMentionLinks = extractAllMentionsLinksFromMessage(message);

	return message
		.replace(A_LINKS_REGEX, () => ` ${allMentionLinks.shift()}`)
		.replace(SPACES_REGEX, '\n')
		.replace(MATRIX_MENTION_LINK_REGEX, (match: any) => {
			const isUsernameMention = match.includes('@');
			if (isUsernameMention) {
				const [, username] = match.replace('[', '').replace(']', '').split('@');
				const [, serverDomain] = username.split(':');

				const withoutServerIdentification = `@${username.split(':').shift()}`;
				const fullUsername = `@${username}`;

				return FederatedUser.isOriginalFromTheProxyServer(serverDomain, homeServerDomain) ? withoutServerIdentification : fullUsername;
			}
			return '@all';
		})
		.split('\n')
		.join(' ')
		.replace(/\s+/g, ' ');
};

const replaceMentionsInMatrixFormatForEachUserExternalMention = async (message: string): Promise<string> => {
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

const replaceMentionsInMatrixFormatForEachInternalUserMention = async (message: string, homeServerDomain: string): Promise<string> => {
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

const replaceMentionsInMatrixFormatForEachInternalMentions = async (message: string, externalRoomId: string): Promise<string> => {
	const { MentionPill } = await import('@rocket.chat/forked-matrix-bot-sdk');
	const promises: Promise<MentionPillType>[] = [];

	message.replace(INTERNAL_GENERAL_REGEX, (): any => promises.push(MentionPill.forRoom(externalRoomId)));

	const externalMentions = await Promise.all(promises);

	return message.replace(INTERNAL_GENERAL_REGEX, () => ` ${externalMentions.shift()?.html}`);
};

const replaceInternalWithExternalMentions = async (message: string, externalRoomId: string, homeServerDomain: string): Promise<string> =>
	(
		await replaceMentionsInMatrixFormatForEachInternalUserMention(
			await replaceMentionsInMatrixFormatForEachUserExternalMention(
				await replaceMentionsInMatrixFormatForEachInternalMentions(message, externalRoomId),
			),
			homeServerDomain,
		)
	)
		.replace(/\s+/g, ' ')
		.trim();

export const toExternalMessageFormat = async (message: string, externalRoomId: string, homeServerDomain: string): Promise<string> =>
	replaceInternalWithExternalMentions(message, externalRoomId, homeServerDomain);
export const toInternalMessageFormat = (message: string, homeServerDomain: string): string =>
	replaceExternalWithInternalMentions(message, homeServerDomain);
