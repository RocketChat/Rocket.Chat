import type { CallHangupReason } from '../../call';
export type ClientMediaSignalHangup = {
    callId: string;
    contractId: string;
    type: 'hangup';
    reason: CallHangupReason;
};
export declare const clientMediaSignalHangupSchema: {
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
            readonly const: "hangup";
        };
        readonly reason: {
            readonly type: "string";
            readonly nullable: false;
        };
    };
    readonly additionalProperties: false;
    readonly required: readonly ["callId", "contractId", "type", "reason"];
};
//# sourceMappingURL=hangup.d.ts.map