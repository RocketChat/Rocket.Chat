import type { IPermission } from '../../definition/permissions/IPermission';
interface IPermissionDeniedErrorParams {
    appId: string;
    missingPermissions: Array<IPermission>;
    methodName?: string;
    reason?: string;
    message?: string;
}
export declare class PermissionDeniedError extends Error {
    constructor({ appId, missingPermissions, methodName, reason, message }: IPermissionDeniedErrorParams);
}
export {};
