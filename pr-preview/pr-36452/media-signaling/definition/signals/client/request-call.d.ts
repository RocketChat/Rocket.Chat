import type { CallService } from '../../call';
export type ClientMediaSignalRequestCall = {
    callId: string;
    contractId: string;
    type: 'request-call';
    callee: {
        type: 'user' | 'sip';
        id: string;
    };
    supportedServices: CallService[];
};
export declare const clientMediaSignalRequestCallSchema: {
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
            readonly const: "request-call";
        };
        readonly callee: {
            readonly type: "object";
            readonly properties: {
                readonly type: {
                    readonly type: "string";
                    readonly nullable: false;
                };
                readonly id: {
                    readonly type: "string";
                    readonly nullable: false;
                };
            };
            readonly required: readonly ["type", "id"];
            readonly additionalProperties: false;
        };
        readonly supportedServices: {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
            readonly nullable: false;
        };
    };
    readonly additionalProperties: false;
    readonly required: readonly ["callId", "contractId", "type", "callee", "supportedServices"];
};
//# sourceMappingURL=request-call.d.ts.map