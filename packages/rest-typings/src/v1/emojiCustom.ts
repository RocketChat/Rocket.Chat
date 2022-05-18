import type { ICustomEmojiDescriptor, IEmojiCustom } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type EmojiCustomEndpoints = {
	'/v1/emoji-custom.all': {
		GET: (params: PaginatedRequest<{ query: string }, 'name'>) => PaginatedResult<{
			emojis: IEmojiCustom[];
		}>;
	};
	'/v1/emoji-custom.list': {
		GET: (params: { query: string; updatedSince?: string }) => {
			emojis: {
				update: IEmojiCustom[];
				remove: IEmojiCustom[];
			};
		};
	};
	'/v1/emoji-custom.delete': {
		POST: (params: { emojiId: ICustomEmojiDescriptor['_id'] }) => void;
	};
	'/v1/emoji-custom.create': {
		POST: (params: { emoji: ICustomEmojiDescriptor }) => void;
	};
	'/v1/emoji-custom.update': {
		POST: (params: { emoji: ICustomEmojiDescriptor }) => void;
	};
};
