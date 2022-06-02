import type { ICustomEmojiDescriptor } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv({
	coerceTypes: true,
});

type emojiCustomDeleteProps = {
	emojiId: ICustomEmojiDescriptor['_id'];
};

const emojiCustomDeletePropsSchema = {
	type: 'object',
	properties: {
		emojiId: {
			type: 'string',
		},
	},
	required: ['emojiId'],
	additionalProperties: false,
};

export const isEmojiCustomDelete = ajv.compile<emojiCustomDeleteProps>(emojiCustomDeletePropsSchema);

type emojiCustomList = {
	query: string;
};

const emojiCustomListSchema = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
		},
	},
	required: ['query'],
	additionalProperties: false,
};

export const isemojiCustomList = ajv.compile<emojiCustomList>(emojiCustomListSchema);

export type EmojiCustomEndpoints = {
	'emoji-custom.all': {
		GET: (params: PaginatedRequest<{ query: string }, 'name'>) => {
			emojis: ICustomEmojiDescriptor[];
		} & PaginatedResult;
	};
	'emoji-custom.list': {
		GET: (params: emojiCustomList) => {
			emojis?: {
				update: ICustomEmojiDescriptor[];
			};
		};
	};
	'emoji-custom.delete': {
		POST: (params: emojiCustomDeleteProps) => void;
	};
};
