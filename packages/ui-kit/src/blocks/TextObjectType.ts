import type { TextObject } from './TextObject';

export const TextObjectType = {
	PLAIN_TEXT: 'plain_text',
	MRKDWN: 'mrkdwn',
} as const satisfies Record<Uppercase<TextObject['type']>, TextObject['type']>;
