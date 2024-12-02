import { BaseBridge } from './BaseBridge';
import type { IMessage } from '../../definition/messages';
import type { IUser } from '../../definition/users';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class ModerationBridge extends BaseBridge {
    public async doReport(messageId: IMessage['id'], description: string, userId: string, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.report(messageId, description, userId, appId);
        }
    }

    public async doDismissReportsByMessageId(messageId: IMessage['id'], reason: string, action: string, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.dismissReportsByMessageId(messageId, reason, action, appId);
        }
    }

    public async doDismissReportsByUserId(userId: IUser['id'], reason: string, action: string, appId: string): Promise<void> {
        if (this.hasWritePermission(appId)) {
            return this.dismissReportsByUserId(userId, reason, action, appId);
        }
    }

    protected abstract report(messageId: string, description: string, userId: string, appId: string): Promise<void>;

    protected abstract dismissReportsByMessageId(messageId: string, reason: string, action: string, appId: string): Promise<void>;

    protected abstract dismissReportsByUserId(userId: string, reason: string, action: string, appId: string): Promise<void>;

    private hasWritePermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.moderation.write)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.moderation.write],
            }),
        );

        return false;
    }
}
