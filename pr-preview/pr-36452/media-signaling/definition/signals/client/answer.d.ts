import type { CallAnswer } from '../../call';
export type ClientMediaSignalAnswer = {
    callId: string;
    type: 'answer';
    contractId: string;
    answer: CallAnswer;
};
export declare const clientMediaSignalAnswerSchema: {
    readonly type: "object";
    readonly properties: {
        readonly callId: {
            readonly type: "string";
            readonly nullable: false;
        };
        readonly contractId: {
            readonly type: "string";
            readonly nullable: false;
        };
        readonly type: {
            readonly const: "answer";
        };
        readonly answer: {
            readonly type: "string";
            readonly nullable: false;
        };
    };
    readonly additionalProperties: false;
    readonly required: readonly ["callId", "contractId", "type", "answer"];
};
//# sourceMappingURL=answer.d.ts.map