import { ajv } from '../../Ajv';

export type POSTCleanHistory = {
	roomId: string;
	latest: string;
	oldest: string;
	inclusive?: boolean;
	excludePinned?: boolean;
	filesOnly?: boolean;
	users?: string[];
	limit?: number;
	ignoreDiscussion?: boolean;
	ignoreThreads?: boolean;
};

const POSTCleanHistorySchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		latest: {
			type: 'string',
		},
		oldest: {
			type: 'string',
		},
		inclusive: {
			type: 'boolean',
			nullable: true,
		},
		excludePinned: {
			type: 'boolean',
			nullable: true,
		},
		filesOnly: {
			type: 'boolean',
			nullable: true,
		},
		users: {
			type: 'array',
			items: {
				type: 'string',
			},
			nullable: true,
		},
		limit: {
			type: 'number',
			nullable: true,
		},
		ignoreDiscussion: {
			type: 'boolean',
			nullable: true,
		},
		ignoreThreads: {
			type: 'boolean',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['roomId', 'latest', 'oldest'],
};

export const isPOSTCleanHistory = ajv.compile<POSTCleanHistory>(POSTCleanHistorySchema);
