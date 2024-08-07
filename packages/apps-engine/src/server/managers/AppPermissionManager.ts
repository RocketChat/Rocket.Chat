import type { IPermission } from '../../definition/permissions/IPermission';
import { getPermissionsByAppId } from '../AppManager';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { APPS_ENGINE_RUNTIME_FILE_PREFIX } from '../runtime/AppsEngineRuntime';

export class AppPermissionManager {
    /**
     * It returns the declaration of the permission if the app declared, or it returns `undefined`.
     */
    public static hasPermission<P extends IPermission>(appId: string, permission: P): P | undefined {
        if (process.env.NODE_ENV === 'test') {
            return permission;
        }

        const grantedPermission = getPermissionsByAppId(appId).find(({ name }) => name === permission.name) as unknown;

        if (!grantedPermission) {
            return undefined;
        }

        return grantedPermission as P;
    }

    public static notifyAboutError(err: Error): void {
        if (err instanceof PermissionDeniedError) {
            const { name, message } = err;

            console.error(`${name}: ${message}\n${this.getCallStack()}`);
        } else {
            console.error(err);
        }
    }

    private static getCallStack(): string {
        const stack = new Error().stack.toString().split('\n');
        const appStackIndex = stack.findIndex((position) => position.includes(APPS_ENGINE_RUNTIME_FILE_PREFIX));

        return stack.slice(4, appStackIndex).join('\n');
    }
}
