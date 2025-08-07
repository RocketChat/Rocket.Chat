export const clientMediaSignalAnswerSchema = {
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
            const: 'answer',
        },
        answer: {
            type: 'string',
            nullable: false,
        },
    },
    additionalProperties: false,
    required: ['callId', 'contractId', 'type', 'answer'],
};
//# sourceMappingURL=answer.js.map