import { ajv } from '../../helpers/schemas';

export type FederationJoinExternalPublicRoomProps = {
	externalRoomId: `!${string}:${string}`;
	roomName?: string;
	pageToken?: string;
};
ajv.addFormat('matrix-room-id', (externalRoomId) => Boolean(externalRoomId?.charAt(0) === '!' && externalRoomId?.includes(':')));

const FederationJoinExternalPublicRoomPropsSchema = {
	type: 'object',
	properties: {
		externalRoomId: {
			type: 'string',
			format: 'matrix-room-id',
		},
		roomName: {
			type: 'string',
			nullable: true,
		},
		pageToken: {
			type: 'string',
			nullable: true,
		},
	},
	additionalProperties: false,
	required: ['externalRoomId'],
};

export const isFederationJoinExternalPublicRoomProps = ajv.compile<FederationJoinExternalPublicRoomProps>(
	FederationJoinExternalPublicRoomPropsSchema,
);
