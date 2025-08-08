import type { JSONSchemaType } from 'ajv';
import type { CallHangupReason } from '../../call';
export type ClientMediaSignalHangup = {
    callId: string;
    contractId: string;
    type: 'hangup';
    reason: CallHangupReason;
};
export declare const clientMediaSignalHangupSchema: JSONSchemaType<ClientMediaSignalHangup>;
//# sourceMappingURL=hangup.d.ts.map