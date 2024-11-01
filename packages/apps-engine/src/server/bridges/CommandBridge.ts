import type { ISlashCommand } from '../../definition/slashcommands';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';
import { BaseBridge } from './BaseBridge';

export abstract class CommandBridge extends BaseBridge {
    public async doDoesCommandExist(command: string, appId: string): Promise<boolean> {
        if (this.hasDefaultPermission(appId)) {
            return this.doesCommandExist(command, appId);
        }
    }

    public async doEnableCommand(command: string, appId: string): Promise<void> {
        if (this.hasDefaultPermission(appId)) {
            return this.enableCommand(command, appId);
        }
    }

    public async doDisableCommand(command: string, appId: string): Promise<void> {
        if (this.hasDefaultPermission(appId)) {
            return this.disableCommand(command, appId);
        }
    }

    public async doModifyCommand(command: ISlashCommand, appId: string): Promise<void> {
        if (this.hasDefaultPermission(appId)) {
            return this.modifyCommand(command, appId);
        }
    }

    public async doRegisterCommand(command: ISlashCommand, appId: string): Promise<void> {
        if (this.hasDefaultPermission(appId)) {
            return this.registerCommand(command, appId);
        }
    }

    public async doUnregisterCommand(command: string, appId: string): Promise<void> {
        if (this.hasDefaultPermission(appId)) {
            return this.unregisterCommand(command, appId);
        }
    }

    /**
     * Checks if the provided command already exists inside of the
     * system which is being bridged. This does not check if the app
     * registered it but it will return whether the supplied command is
     * already defined by something else or not.
     *
     * @param command the command to check if it exists
     * @param appId the id of the app calling this
     * @returns whether the command is already in the system
     */
    protected abstract doesCommandExist(command: string, appId: string): Promise<boolean>;

    /**
     * Enables an existing command from the bridged system. The callee
     * must ensure that the command that's being enabled is defined by
     * the bridged system and not another App since the bridged system
     * will not check that.
     *
     * @param command the command to enable
     * @param appId the id of the app calling this
     */
    protected abstract enableCommand(command: string, appId: string): Promise<void>;

    /**
     * Disables an existing command from the bridged system, the callee must
     * ensure the command disabling is defined by the system and not another
     * App since the bridged system won't check that.
     *
     * @param command the command which to disable
     * @param appId the id of the app calling this
     */
    protected abstract disableCommand(command: string, appId: string): Promise<void>;

    /**
     * Changes how a system slash command behaves, allows Apps to provide
     * different executors per system commands.
     *
     * @param command the modified slash command
     * @param appId the id of the app calling this
     */
    protected abstract modifyCommand(command: ISlashCommand, appId: string): Promise<void>;

    /**
     * Registers a command with the system which is being bridged.
     *
     * @param command the command to register
     * @param appId the id of the app calling this
     * @param toRun the executor which is called when the command is ran
     */
    protected abstract registerCommand(command: ISlashCommand, appId: string): Promise<void>;

    /**
     * Unregisters the provided command from the bridged system.
     *
     * @param command the command to unregister
     * @param appId the id of the app calling this
     */
    protected abstract unregisterCommand(command: string, appId: string): Promise<void>;

    private hasDefaultPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.command.default)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.command.default],
            }),
        );

        return false;
    }
}
