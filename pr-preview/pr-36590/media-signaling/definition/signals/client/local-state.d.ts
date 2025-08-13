import type { JSONSchemaType } from 'ajv';
import type { CallState } from '../../call';
import type { ClientContractState, ClientState } from '../../client';
/** Client is sending their local call state */
export type ClientMediaSignalLocalState = {
    callId: string;
    contractId: string;
    type: 'local-state';
    callState: CallState;
    clientState: ClientState;
    serviceStates?: Record<string, string>;
    ignored?: boolean;
    contractState: ClientContractState;
};
export declare const clientMediaSignalLocalStateSchema: JSONSchemaType<ClientMediaSignalLocalState>;
//# sourceMappingURL=local-state.d.ts.map