import type { JSONSchemaType } from 'ajv';
/** Client is reporting an error */
export type ClientMediaSignalError = {
    callId: string;
    contractId: string;
    type: 'error';
    errorCode: string;
};
export declare const clientMediaSignalErrorSchema: JSONSchemaType<ClientMediaSignalError>;
//# sourceMappingURL=error.d.ts.map