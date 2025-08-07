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
export declare const clientMediaSignalLocalStateSchema: {
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
            readonly const: "local-state";
        };
        readonly callState: {
            readonly type: "string";
            readonly nullable: false;
        };
        readonly clientState: {
            readonly type: "string";
            readonly nullable: false;
        };
        readonly serviceStates: {
            readonly type: "object";
            readonly patternProperties: {
                readonly '.*': {
                    readonly type: "string";
                };
            };
            readonly nullable: true;
        };
    };
    readonly additionalProperties: false;
    readonly required: readonly ["callId", "contractId", "type", "callState", "clientState"];
};
//# sourceMappingURL=local-state.d.ts.map