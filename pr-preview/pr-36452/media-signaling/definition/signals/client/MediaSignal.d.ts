import { type ClientMediaSignalAnswer } from './answer';
import { type ClientMediaSignalError } from './error';
import { type ClientMediaSignalHangup } from './hangup';
import { type ClientMediaSignalLocalSDP } from './local-sdp';
import { type ClientMediaSignalLocalState } from './local-state';
import { type ClientMediaSignalRequestCall } from './request-call';
export type ClientMediaSignal = ClientMediaSignalLocalSDP | ClientMediaSignalError | ClientMediaSignalAnswer | ClientMediaSignalHangup | ClientMediaSignalRequestCall | ClientMediaSignalLocalState;
export declare const clientMediaSignalSchema: {
    readonly type: "object";
    readonly additionalProperties: true;
    readonly discriminator: {
        readonly propertyName: "type";
    };
    readonly required: readonly ["type"];
    readonly oneOf: readonly [{
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
    }, {
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
    }, {
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
                readonly const: "answer";
            };
            readonly answer: {
                readonly type: "string";
                readonly nullable: false;
            };
        };
        readonly additionalProperties: false;
        readonly required: readonly ["callId", "contractId", "type", "answer"];
    }, {
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
    }, {
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
    }, {
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
    }];
};
export type ClientMediaSignalType = ClientMediaSignal['type'];
type ExtractMediaSignal<T, K extends ClientMediaSignalType> = T extends {
    type: K;
} ? T : never;
export type GenericClientMediaSignal<K extends ClientMediaSignalType> = ExtractMediaSignal<ClientMediaSignal, K>;
export type ClientMediaSignalBody<K extends ClientMediaSignalType = ClientMediaSignalType> = Omit<GenericClientMediaSignal<K>, 'callId' | 'contractId' | 'type'>;
export {};
//# sourceMappingURL=MediaSignal.d.ts.map