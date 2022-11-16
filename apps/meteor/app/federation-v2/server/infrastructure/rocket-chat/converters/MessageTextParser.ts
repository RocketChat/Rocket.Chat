import sanitizeHtml from 'sanitize-html';

import { FederatedUser } from '../../../domain/FederatedUser';

const replaceExternalWithInternalMentions = (message: string, homeServerDomain: string): string =>
	sanitizeHtml(message, {
		transformTags: {
			a: (_, { href }): { tagName: string; text: string; attribs: Record<string, any> } => {
				const isUsernameMention = href.includes('@');
				if (isUsernameMention) {
					const [, username] = href.split('@');
					const [, serverDomain] = username.split(':');

					const withoutServerIdentification = `@${username.split(':').shift()}`;
					const fullUsername = `@${username}`;

					return {
						tagName: '',
						text: FederatedUser.isOriginalFromTheProxyServer(serverDomain, homeServerDomain) ? withoutServerIdentification : fullUsername,
						attribs: {},
					};
				}

				return {
					tagName: '',
					text: '@all',
					attribs: {},
				};
			},
		},
	});

export const toInternalMessageFormat = ({
	message,
	homeServerDomain,
	isAReplyToAMessage = false,
}: {
	message: string;
	homeServerDomain: string;
	isAReplyToAMessage?: boolean;
}): string => (isAReplyToAMessage ? message : replaceExternalWithInternalMentions(message, homeServerDomain));

export const toInternalQuoteMessageFormat = async ({
	homeServerDomain,
	message,
	messageToReplyToUrl,
}: {
	messageToReplyToUrl: string;
	message: string;
	homeServerDomain: string;
}): Promise<string> => {
	const sanitizedMessage = sanitizeHtml(message, {
		allowedTags: ['a'],
		allowedAttributes: {
			a: ['href'],
		},
		nonTextTags: ['mx-reply', 'blockquote'],
	});
	return `[ ](${messageToReplyToUrl}) ${replaceExternalWithInternalMentions(sanitizedMessage, homeServerDomain)}`;
};
