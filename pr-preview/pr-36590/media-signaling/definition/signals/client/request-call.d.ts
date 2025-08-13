import type { JSONSchemaType } from 'ajv';
import type { CallService } from '../../call';
export type ClientMediaSignalRequestCall = {
    /** the callId on this signal is temporary and is never propagated to other agents */
    callId: string;
    contractId: string;
    type: 'request-call';
    callee: {
        type: 'user' | 'sip';
        id: string;
    };
    supportedServices: CallService[];
};
export declare const clientMediaSignalRequestCallSchema: JSONSchemaType<ClientMediaSignalRequestCall>;
//# sourceMappingURL=request-call.d.ts.map