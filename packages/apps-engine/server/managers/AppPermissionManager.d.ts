import type { IPermission } from '../../definition/permissions/IPermission';
export declare class AppPermissionManager {
    /**
     * It returns the declaration of the permission if the app declared, or it returns `undefined`.
     */
    static hasPermission<P extends IPermission>(appId: string, permission: P): P | undefined;
    static notifyAboutError(err: Error): void;
    private static getCallStack;
}
