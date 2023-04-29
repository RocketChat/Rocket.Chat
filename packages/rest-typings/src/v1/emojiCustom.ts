import type { ICustomEmojiDescriptor, IEmojiCustom } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';
import { ajv } from '../helpers/schemas';

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
	updatedSince?: string;
};

const emojiCustomListSchema = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
		},
		updatedSince: {
			type: 'string',
			nullable: true,
		},
	},
	required: ['query'],
	additionalProperties: false,
};

export const isEmojiCustomList = ajv.compile<emojiCustomList>(emojiCustomListSchema);

export type EmojiCustomEndpoints = {
	'/v1/emoji-custom.all': {
		GET: (params: PaginatedRequest<{ query: string }, 'name'>) => PaginatedResult<{
			emojis: IEmojiCustom[];
		}>;
	};
	'/v1/emoji-custom.list': {
		GET: (params: emojiCustomList) => {
			emojis: {
				update: IEmojiCustom[];
				remove: IEmojiCustom[];
			};
		};
	};
	'/v1/emoji-custom.delete': {
		POST: (params: emojiCustomDeleteProps) => void;
	};
	'/v1/emoji-custom.create': {
		POST: (params: { emoji: ICustomEmojiDescriptor }) => void;
	};
	'/v1/emoji-custom.update': {
		POST: (params: { emoji: ICustomEmojiDescriptor }) => void;
	};
};
