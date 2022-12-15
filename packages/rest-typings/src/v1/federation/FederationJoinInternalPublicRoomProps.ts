import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type FederationJoinInternalPublicRoomProps = {
	internalRoomId: string;
};

const FederationJoinInternalPublicRoomPropsSchema = {
	type: 'object',
	properties: {
		internalRoomId: {
			type: 'string',
		},
	},
	additionalProperties: false,
	required: ['internalRoomId'],
};

export const isFederationJoinInternalPublicRoomProps = ajv.compile<FederationJoinInternalPublicRoomProps>(
	FederationJoinInternalPublicRoomPropsSchema,
);
