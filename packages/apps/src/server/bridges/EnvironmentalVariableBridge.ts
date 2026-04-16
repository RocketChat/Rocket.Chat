import { BaseBridge } from './BaseBridge';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';

export abstract class EnvironmentalVariableBridge extends BaseBridge {
	public async doGetValueByName(envVarName: string, appId: string): Promise<string | undefined> {
		if (this.hasReadPermission(appId)) {
			return this.getValueByName(envVarName, appId);
		}

		return undefined;
	}

	public async doIsReadable(envVarName: string, appId: string): Promise<boolean> {
		if (this.hasReadPermission(appId)) {
			return this.isReadable(envVarName, appId);
		}

		return undefined as unknown as boolean;
	}

	public async doIsSet(envVarName: string, appId: string): Promise<boolean> {
		if (this.hasReadPermission(appId)) {
			return this.isSet(envVarName, appId);
		}

		return undefined as unknown as boolean;
	}

	protected abstract getValueByName(envVarName: string, appId: string): Promise<string | undefined>;

	protected abstract isReadable(envVarName: string, appId: string): Promise<boolean>;

	protected abstract isSet(envVarName: string, appId: string): Promise<boolean>;

	private hasReadPermission(appId: string): boolean {
		if (AppPermissionManager.hasPermission(appId, AppPermissions.env.read)) {
			return true;
		}

		AppPermissionManager.notifyAboutError(
			new PermissionDeniedError({
				appId,
				missingPermissions: [AppPermissions.env.read],
			}),
		);

		return false;
	}
}
