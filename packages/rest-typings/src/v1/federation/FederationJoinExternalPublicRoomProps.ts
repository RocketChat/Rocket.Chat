import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type FederationJoinExternalPublicRoomProps = {
	externalRoomId: `!${string}:${string}`;
};
ajv.addFormat('matrix-room-id', (externalRoomId) => Boolean(externalRoomId?.charAt(0) === '!' && externalRoomId?.includes(':')));

const FederationJoinExternalPublicRoomPropsSchema = {
	type: 'object',
	properties: {
		externalRoomId: {
			type: 'string',
			format: 'matrix-room-id',
		},
	},
	additionalProperties: false,
	required: ['externalRoomId'],
};

export const isFederationJoinExternalPublicRoomProps = ajv.compile<FederationJoinExternalPublicRoomProps>(
	FederationJoinExternalPublicRoomPropsSchema,
);
