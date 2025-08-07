export const clientMediaSignalErrorSchema = {
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
            const: 'error',
        },
        errorCode: {
            type: 'string',
            nullable: false,
        },
    },
    additionalProperties: false,
    required: ['callId', 'contractId', 'type', 'errorCode'],
};
//# sourceMappingURL=error.js.map