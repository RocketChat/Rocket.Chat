import type { JSONSchemaType } from 'ajv';
export type ClientMediaSignalLocalSDP = {
    callId: string;
    contractId: string;
    type: 'local-sdp';
    sdp: RTCSessionDescriptionInit;
};
export declare const clientMediaSignalLocalSDPSchema: JSONSchemaType<ClientMediaSignalLocalSDP>;
//# sourceMappingURL=local-sdp.d.ts.map