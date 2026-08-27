import type { ICustomEmojiDescriptor } from '@rocket.chat/core-typings';

import { ajv, ajvQuery } from './Ajv';

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

// All /v1/emoji-custom.* routes are typed by their migrated implementations
// (apps/meteor/server/api/v1/emoji-custom.ts) via ExtractRoutesFromAPI.
export type EmojiCustomEndpoints = {};
