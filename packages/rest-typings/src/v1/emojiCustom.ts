import type { ICustomEmojiDescriptor } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type EmojiCustomEndpoints = {
	'/v1/emoji-custom.all': {
		GET: (params: PaginatedRequest<{ query: string }, 'name'>) => {
			emojis: ICustomEmojiDescriptor[];
		} & PaginatedResult;
	};
	'/v1/emoji-custom.list': {
		GET: (params: { query: string }) => {
			emojis?: {
				update: ICustomEmojiDescriptor[];
			};
		};
	};
	'/v1/emoji-custom.delete': {
		POST: (params: { emojiId: ICustomEmojiDescriptor['_id'] }) => void;
	};
};
