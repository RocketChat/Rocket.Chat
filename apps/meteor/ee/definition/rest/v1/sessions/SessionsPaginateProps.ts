import type { PaginatedRequest } from '@rocket.chat/rest-typings';
import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

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
