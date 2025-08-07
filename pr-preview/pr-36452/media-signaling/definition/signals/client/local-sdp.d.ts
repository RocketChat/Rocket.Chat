export type ClientMediaSignalLocalSDP = {
    callId: string;
    contractId: string;
    type: 'local-sdp';
    sdp: RTCSessionDescriptionInit;
};
export declare const clientMediaSignalLocalSDPSchema: {
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
            readonly const: "local-sdp";
        };
        readonly sdp: {
            readonly type: "object";
            readonly properties: {
                readonly sdp: {
                    readonly type: "string";
                    readonly nullable: true;
                };
                readonly type: {
                    readonly type: "string";
                    readonly nullable: false;
                };
            };
            readonly additionalProperties: false;
            readonly nullable: false;
            readonly required: readonly ["type"];
        };
    };
    readonly additionalProperties: false;
    readonly required: readonly ["callId", "contractId", "type", "sdp"];
};
//# sourceMappingURL=local-sdp.d.ts.map