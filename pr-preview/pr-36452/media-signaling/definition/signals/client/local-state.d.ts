import type { JSONSchemaType } from 'ajv';
import type { CallState } from '../../call';
import type { ClientState } from '../../client';
export type ClientMediaSignalLocalState = {
    callId: string;
    contractId: string;
    type: 'local-state';
    callState: CallState;
    clientState: ClientState;
    serviceStates?: Record<string, string>;
};
export declare const clientMediaSignalLocalStateSchema: JSONSchemaType<ClientMediaSignalLocalState>;
//# sourceMappingURL=local-state.d.ts.map