import type { IPermission } from '../../definition/permissions/IPermission';

interface IPermissionDeniedErrorParams {
    appId: string;
    missingPermissions: Array<IPermission>;
    methodName?: string;
    reason?: string;
    message?: string;
}

export class PermissionDeniedError extends Error {
    constructor({ appId, missingPermissions, methodName, reason, message }: IPermissionDeniedErrorParams) {
        if (message) {
            super(message);
        } else {
            const permissions = missingPermissions.map((permission) => `"${permission.name}"`).join(', ');

            super(
                `Failed to call the method ${methodName ? `"${methodName}"` : ''} as the app (${appId}) lacks the following permissions:\n` +
                    `[${permissions}]. Declare them in your app.json to fix the issue.\n` +
                    `reason: ${reason}`,
            );
        }
    }
}
