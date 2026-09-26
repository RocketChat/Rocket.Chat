import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

export type DmFileProps = PaginatedRequest<
	({ roomId: string; username?: string } | { roomId?: string; username: string }) & {
		name?: string;
		typeGroup?: string;
		query?: string;
		onlyConfirmed?: boolean;
	}
>;

const dmFilesListPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			nullable: true,
		},
		username: {
			type: 'string',
			nullable: true,
		},
		...paginationQueryProperties,
		sort: {
			type: 'string',
			nullable: true,
		},
		name: {
			type: 'string',
			nullable: true,
		},
		typeGroup: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
		onlyConfirmed: {
			type: 'boolean',
		},
	},
	oneOf: [
		{ type: 'object', required: ['roomId'] },
		{ type: 'object', required: ['username'] },
	],
	required: [],
	additionalProperties: false,
};

export const isDmFileProps = ajvQuery.compile<DmFileProps>(dmFilesListPropsSchema);
