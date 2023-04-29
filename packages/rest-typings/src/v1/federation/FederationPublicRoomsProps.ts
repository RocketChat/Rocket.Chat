import { ajv } from '../../helpers/schemas';
import type { FederationPaginatedRequest } from '.';

export type FederationSearchPublicRoomsProps = FederationPaginatedRequest<{
	serverName?: string;
	roomName?: string;
}>;

const federationSearchPublicRoomsPropsSchema = {
	type: 'object',
	properties: {
		serverName: {
			type: 'string',
			nullable: true,
		},
		roomName: {
			type: 'string',
			nullable: true,
		},
		count: {
			type: 'string',
			nullable: true,
		},
		pageToken: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
};

export const isFederationSearchPublicRoomsProps = ajv.compile<FederationSearchPublicRoomsProps>(federationSearchPublicRoomsPropsSchema);
