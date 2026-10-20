import type { ICustomEmojiDescriptor, IEmojiCustom, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { WithId } from 'mongodb';

import { ajv, ajvQuery } from './Ajv';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';

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

// Public mirror of the implementation-derived routes (apps/meteor/server/api/v1/emoji-custom.ts,
// `ExtractRoutesFromAPI<typeof emojiCustomCreateEndpoints>`). Kept identical so the two declarations
// merge without TS2320, and so SDK/external consumers that don't compile apps/meteor keep these routes.
export type EmojiCustomEndpoints = {
	'/v1/emoji-custom.list': {
		GET: (params: emojiCustomList) => {
			emojis: { update: IEmojiCustom[]; remove: WithId<RocketChatRecordDeleted<IEmojiCustom>>[] };
		};
	};
	'/v1/emoji-custom.all': {
		GET: (params: PaginatedRequest<{ name?: string }, 'name'>) => {
			emojis: IEmojiCustom[];
			count: number;
			offset: number;
			total: number;
		};
	};
	'/v1/emoji-custom.create': {
		POST: (params?: never) => void;
	};
	'/v1/emoji-custom.update': {
		POST: (params?: never) => void;
	};
	'/v1/emoji-custom.delete': {
		POST: (params: { emojiId: string }) => void;
	};
};
