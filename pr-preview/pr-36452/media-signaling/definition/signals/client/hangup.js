export const clientMediaSignalHangupSchema = {
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
            const: 'hangup',
        },
        reason: {
            type: 'string',
            nullable: false,
        },
    },
    additionalProperties: false,
    required: ['callId', 'contractId', 'type', 'reason'],
};
//# sourceMappingURL=hangup.js.map