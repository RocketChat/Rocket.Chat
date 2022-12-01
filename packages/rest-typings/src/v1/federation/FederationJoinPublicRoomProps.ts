import Ajv from 'ajv';

const ajv = new Ajv({
    coerceTypes: true,
});

export type FederationJoinPublicRoomProps = {
    externalRoomId: string;
    externalRoomName: string;
};

const FederationJoinPublicRoomPropsSchema = {
    type: 'object',
    properties: {
        externalRoomId: {
            type: 'string',
        },
        externalRoomName: {
            type: 'string',
        },
    },
    additionalProperties: false,
    required: ['externalRoomId', 'externalRoomName'],
};

export const isFederationJoinPublicRoomProps = ajv.compile<FederationJoinPublicRoomProps>(FederationJoinPublicRoomPropsSchema);
