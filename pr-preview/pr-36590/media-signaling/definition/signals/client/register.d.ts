import type { JSONSchemaType } from 'ajv';
/** Client is reporting a brand new session */
export type ClientMediaSignalRegister = {
    type: 'register';
    contractId: string;
    oldContractId?: string;
};
export declare const clientMediaSignalRegisterSchema: JSONSchemaType<ClientMediaSignalRegister>;
//# sourceMappingURL=register.d.ts.map