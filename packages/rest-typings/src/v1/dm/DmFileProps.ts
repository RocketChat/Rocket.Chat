import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajv } from './../Ajv';


export type DmFileProps = PaginatedRequest<
	({ roomId: string; username?: string } | { roomId?: string; username: string }) & { name?: string; typeGroup?: string; query?: string }
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
		offset: {
			type: 'number',
			nullable: true,
		},
		count: {
			type: 'number',
			nullable: true,
		},
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
	},
	oneOf: [{ required: ['roomId'] }, { required: ['username'] }],
	required: [],
	additionalProperties: false,
};

export const isDmFileProps = ajv.compile<DmFileProps>(dmFilesListPropsSchema);
