import Ajv from 'ajv';

import type { FederationPaginatedRequest } from '.';

const ajv = new Ajv();

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
