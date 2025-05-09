import { BaseBridge } from './BaseBridge';
import type { IEmail } from '../../definition/email';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class EmailBridge extends BaseBridge {
    public async doSendEmail(email: IEmail, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.sendEmail(email, appId);
        }
    }

    protected abstract sendEmail(email: IEmail, appId: string): Promise<void>;

    private hasWritePermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.email.send)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.email.send],
            }),
        );

        return false;
    }
}
