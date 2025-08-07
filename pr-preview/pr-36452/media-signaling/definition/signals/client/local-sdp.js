export const clientMediaSignalLocalSDPSchema = {
    type: 'object',
    properties: {
        callId: {
            type: 'string',
            nullable: false,
        },
        contractId: {
            type: 'string',
            nullable: false,
        },
        type: {
            const: 'local-sdp',
        },
        sdp: {
            type: 'object',
            properties: {
                sdp: {
                    type: 'string',
                    nullable: true,
                },
                type: {
                    type: 'string',
                    nullable: false,
                },
            },
            additionalProperties: false,
            nullable: false,
            required: ['type'],
        },
    },
    additionalProperties: false,
    required: ['callId', 'contractId', 'type', 'sdp'],
};
//# sourceMappingURL=local-sdp.js.map