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
            type: 'string',
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
            required: [],
        },
        ignored: {
            type: 'boolean',
            nullable: true,
        },
        contractState: {
            type: 'string',
            nullable: false,
        },
    },
    additionalProperties: false,
    required: ['callId', 'contractId', 'type', 'callState', 'clientState', 'contractState'],
};
//# sourceMappingURL=local-state.js.map