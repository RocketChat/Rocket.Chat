import Ajv, { JSONSchemaType } from 'ajv';

import type { ICustomEmojiDescriptor } from '../../ICustomEmojiDescriptor';
import { PaginatedRequest } from '../helpers/PaginatedRequest';
import { PaginatedResult } from '../helpers/PaginatedResult';

const ajv = new Ajv();

type emojiCustomDeleteProps = {
	emojiId: ICustomEmojiDescriptor['_id'];
};

const emojiCustomDeletePropsSchema: JSONSchemaType<emojiCustomDeleteProps> = {
	type: 'object',
	properties: {
		emojiId: {
			type: 'string',
		},
	},
	required: ['emojiId'],
	additionalProperties: false,
};

export const isEmojiCustomDelete = ajv.compile(emojiCustomDeletePropsSchema);

export type EmojiCustomEndpoints = {
	'emoji-custom.all': {
		GET: (params: PaginatedRequest<{ query: string }, 'name'>) => {
			emojis: ICustomEmojiDescriptor[];
		} & PaginatedResult;
	};
	'emoji-custom.list': {
		GET: (params: { query: string }) => {
			emojis?: {
				update: ICustomEmojiDescriptor[];
			};
		};
	};
	'emoji-custom.delete': {
		POST: (params: emojiCustomDeleteProps) => void;
	};
};
