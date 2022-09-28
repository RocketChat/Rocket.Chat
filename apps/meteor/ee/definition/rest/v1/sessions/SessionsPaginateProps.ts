import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import { ajv } from '@rocket.chat/rest-typings';

export type SessionsPaginateProps = PaginatedRequest<{
	filter?: string;
}>;

export const isSessionsPaginateProps = ajv.compile<SessionsPaginateProps>({
	type: 'object',
	properties: {
		offset: {
			type: 'number',
		},
		count: {
			type: 'number',
		},
		filter: {
			type: 'string',
		},
		sort: {
			type: 'string',
		},
	},
	required: [],
	additionalProperties: false,
});
