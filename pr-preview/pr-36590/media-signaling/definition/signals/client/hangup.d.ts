import type { JSONSchemaType } from 'ajv';
import type { CallHangupReason } from '../../call';
/** Client is saying they hanged up from a call. The reason specifies if its a clean hangup or an error */
export type ClientMediaSignalHangup = {
    callId: string;
    contractId: string;
    type: 'hangup';
    reason: CallHangupReason;
};
export declare const clientMediaSignalHangupSchema: JSONSchemaType<ClientMediaSignalHangup>;
//# sourceMappingURL=hangup.d.ts.map