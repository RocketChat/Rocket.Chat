export type ClientMediaSignalError = {
    callId: string;
    contractId: string;
    type: 'error';
    errorCode: string;
};
export declare const clientMediaSignalErrorSchema: {
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
            readonly const: "error";
        };
        readonly errorCode: {
            readonly type: "string";
            readonly nullable: false;
        };
    };
    readonly additionalProperties: false;
    readonly required: readonly ["callId", "contractId", "type", "errorCode"];
};
//# sourceMappingURL=error.d.ts.map