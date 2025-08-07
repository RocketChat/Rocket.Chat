export const clientMediaSignalLocalStateSchema = {
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
            const: 'local-state',
        },
        callState: {
            type: 'string',
            nullable: false,
        },
        clientState: {
            type: 'string',
            nullable: false,
        },
        serviceStates: {
            type: 'object',
            patternProperties: {
                '.*': {
                    type: 'string',
                },
            },
            nullable: true,
        },
    },
    additionalProperties: false,
    required: ['callId', 'contractId', 'type', 'callState', 'clientState'],
};
//# sourceMappingURL=local-state.js.map