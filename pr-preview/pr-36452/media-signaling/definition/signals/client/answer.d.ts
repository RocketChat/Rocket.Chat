import type { JSONSchemaType } from 'ajv';
import type { CallAnswer } from '../../call';
/** Client is saying that the user accepted or rejected a call, or simply reporting that the user can or can't be reached */
export type ClientMediaSignalAnswer = {
    callId: string;
    type: 'answer';
    contractId: string;
    answer: CallAnswer;
};
export declare const clientMediaSignalAnswerSchema: JSONSchemaType<ClientMediaSignalAnswer>;
//# sourceMappingURL=answer.d.ts.map