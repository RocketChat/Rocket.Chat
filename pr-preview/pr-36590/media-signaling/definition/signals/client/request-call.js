export const clientMediaSignalRequestCallSchema = {
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
            type: 'string',
            const: 'request-call',
        },
        callee: {
            type: 'object',
            properties: {
                type: {
                    type: 'string',
                    nullable: false,
                },
                id: {
                    type: 'string',
                    nullable: false,
                },
            },
            required: ['type', 'id'],
            additionalProperties: false,
        },
        supportedServices: {
            type: 'array',
            items: {
                type: 'string',
            },
            nullable: false,
        },
    },
    additionalProperties: false,
    required: ['callId', 'contractId', 'type', 'callee', 'supportedServices'],
};
//# sourceMappingURL=request-call.js.map