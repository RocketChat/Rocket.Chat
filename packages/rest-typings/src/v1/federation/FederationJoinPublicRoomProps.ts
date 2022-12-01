import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type FederationJoinPublicRoomProps = {
	externalRoomId: string;
};
ajv.addFormat('matrix-room-id', (externalRoomId) => Boolean(externalRoomId?.charAt(0) === '!' && externalRoomId?.includes(':')));

const FederationJoinPublicRoomPropsSchema = {
	type: 'object',
	properties: {
		externalRoomId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['externalRoomId'],
};

export const isFederationJoinPublicRoomProps = ajv.compile<FederationJoinPublicRoomProps>(FederationJoinPublicRoomPropsSchema);
