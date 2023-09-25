import type { LicenseLimitKind } from './definition/ILicenseV3';
import type { LimitContext } from './definition/LimitContext';
import { getAppsConfig, getMaxActiveUsers, getUnmodifiedLicenseAndModules } from './deprecated';
import { onLicense } from './events/deprecated';
import {
	onInvalidFeature,
	onInvalidateLicense,
	onLimitReached,
	onModule,
	onToggledFeature,
	onValidFeature,
	onValidateLicense,
} from './events/listeners';
import { overwriteClassOnLicense } from './events/overwriteClassOnLicense';
import { LicenseManager } from './license';
import { getModules, hasModule } from './modules';
import { getTags } from './tags';
import { getCurrentValueForLicenseLimit, setLicenseLimitCounter } from './validation/getCurrentValueForLicenseLimit';
import { validateFormat } from './validation/validateFormat';
import { setWorkspaceUrl } from './workspaceUrl';

export * from './definition/ILicenseTag';
export * from './definition/ILicenseV2';
export * from './definition/ILicenseV3';
export * from './definition/LicenseBehavior';
export * from './definition/LicenseLimit';
export * from './definition/LicenseModule';
export * from './definition/LicensePeriod';
export * from './definition/LimitContext';

export class License extends LicenseManager {
	public static validateFormat(...args: Parameters<typeof validateFormat>) {
		return validateFormat(...args);
	}

	public static async setWorkspaceUrl(...args: Parameters<typeof setWorkspaceUrl>) {
		return setWorkspaceUrl(...args);
	}

	public static hasModule(...args: Parameters<typeof hasModule>) {
		return hasModule(...args);
	}

	public static getModules(...args: Parameters<typeof getModules>) {
		return getModules(...args);
	}

	public static getTags(...args: Parameters<typeof getTags>) {
		return getTags(...args);
	}

	public static async overwriteClassOnLicense(...args: Parameters<typeof overwriteClassOnLicense>) {
		return overwriteClassOnLicense(...args);
	}

	public static setLicenseLimitCounter(...args: Parameters<typeof setLicenseLimitCounter>) {
		return setLicenseLimitCounter(...args);
	}

	public static async getCurrentValueForLicenseLimit(...args: Parameters<typeof getCurrentValueForLicenseLimit>) {
		return getCurrentValueForLicenseLimit(...args);
	}

	public static async isLimitReached<T extends LicenseLimitKind>(action: T, context?: Partial<LimitContext<T>>) {
		return this.shouldPreventAction(action, context, 0);
	}

	public static onValidFeature(...args: Parameters<typeof onValidFeature>) {
		return onValidFeature(...args);
	}

	public static onInvalidFeature(...args: Parameters<typeof onInvalidFeature>) {
		return onInvalidFeature(...args);
	}

	public static onToggledFeature(...args: Parameters<typeof onToggledFeature>) {
		return onToggledFeature(...args);
	}

	public static onModule(...args: Parameters<typeof onModule>) {
		return onModule(...args);
	}

	public static onValidateLicense(...args: Parameters<typeof onValidateLicense>) {
		return onValidateLicense(...args);
	}

	public static onInvalidateLicense(...args: Parameters<typeof onInvalidateLicense>) {
		return onInvalidateLicense(...args);
	}

	public static onLimitReached(...args: Parameters<typeof onLimitReached>) {
		return onLimitReached(...args);
	}

	// Deprecated:
	public static onLicense(...args: Parameters<typeof onLicense>) {
		return onLicense(...args);
	}

	// Deprecated:
	public static getMaxActiveUsers() {
		return getMaxActiveUsers();
	}

	// Deprecated:
	public static getAppsConfig() {
		return getAppsConfig();
	}

	// Deprecated:
	public static getUnmodifiedLicenseAndModules() {
		return getUnmodifiedLicenseAndModules();
	}
}
