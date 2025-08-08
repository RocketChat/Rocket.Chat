import type { JSONSchemaType } from 'ajv';
export type ClientMediaSignalError = {
    callId: string;
    contractId: string;
    type: 'error';
    errorCode: string;
};
export declare const clientMediaSignalErrorSchema: JSONSchemaType<ClientMediaSignalError>;
//# sourceMappingURL=error.d.ts.map