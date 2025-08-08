import type { JSONSchemaType } from 'ajv';
import type { CallAnswer } from '../../call';
export type ClientMediaSignalAnswer = {
    callId: string;
    type: 'answer';
    contractId: string;
    answer: CallAnswer;
};
export declare const clientMediaSignalAnswerSchema: JSONSchemaType<ClientMediaSignalAnswer>;
//# sourceMappingURL=answer.d.ts.map