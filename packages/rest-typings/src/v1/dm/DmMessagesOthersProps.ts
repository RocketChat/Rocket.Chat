import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';
import { paginationQueryProperties } from '../pagination';

export type DmMessagesOthersProps = PaginatedRequest<{
	roomId: string;
	fields?: string;
	query?: string;
}>;

const dmMessagesOthersPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
			minLength: 1,
		},
		fields: {
			type: 'string',
		},
		query: {
			type: 'string',
		},
		...paginationQueryProperties,
		sort: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isDmMessagesOthersProps = ajvQuery.compile<DmMessagesOthersProps>(dmMessagesOthersPropsSchema);
