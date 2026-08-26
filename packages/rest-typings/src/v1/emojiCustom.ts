import type { IEmojiCustom, ICustomEmojiDescriptor } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

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

type emojiCustomList = { query?: string; updatedSince?: string; _updatedAt?: string; _id?: string };

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
		_updatedAt: {
			type: 'string',
		},
		_id: {
			type: 'string',
		},
	},
	required: [],
	additionalProperties: false,
};

export const isEmojiCustomList = ajvQuery.compile<emojiCustomList>(emojiCustomListSchema);

export type EmojiCustomEndpoints = {
	// Type-migration pending: the ExtractRoutesFromAPI emit for this route is
	// weaker than this declaration (see the Omit in the meteor augmentation).
	'/v1/emoji-custom.all': {
		GET: (params: PaginatedRequest<{ name?: string }, 'name'>) => PaginatedResult<{
			emojis: IEmojiCustom[];
		}>;
	};
};
