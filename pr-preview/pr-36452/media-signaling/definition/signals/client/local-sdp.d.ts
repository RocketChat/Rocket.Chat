import type { JSONSchemaType } from 'ajv';
/** Client is sending the local session description to the server */
export type ClientMediaSignalLocalSDP = {
    callId: string;
    contractId: string;
    type: 'local-sdp';
    sdp: RTCSessionDescriptionInit;
};
export declare const clientMediaSignalLocalSDPSchema: JSONSchemaType<ClientMediaSignalLocalSDP>;
//# sourceMappingURL=local-sdp.d.ts.map