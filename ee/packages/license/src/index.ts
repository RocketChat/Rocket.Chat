import type { LicenseLimitKind } from './definition/ILicenseV3';
import type { LicenseInfo } from './definition/LicenseInfo';
import type { LimitContext } from './definition/LimitContext';
import { getAppsConfig, getMaxActiveUsers, getUnmodifiedLicenseAndModules } from './deprecated';
import { onLicense } from './events/deprecated';
import {
	onBehaviorToggled,
	onBehaviorTriggered,
	onInvalidFeature,
	onInvalidateLicense,
	onLimitReached,
	onModule,
	onChange,
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

export { DuplicatedLicenseError } from './errors/DuplicatedLicenseError';
export * from './definition/ILicenseTag';
export * from './definition/ILicenseV2';
export * from './definition/ILicenseV3';
export * from './definition/LicenseBehavior';
export * from './definition/LicenseInfo';
export * from './definition/LicenseLimit';
export * from './definition/LicenseModule';
export * from './definition/LicensePeriod';
export * from './definition/LimitContext';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface License {
	validateFormat: typeof validateFormat;
	hasModule: typeof hasModule;
	getModules: typeof getModules;
	getTags: typeof getTags;
	overwriteClassOnLicense: typeof overwriteClassOnLicense;
	setLicenseLimitCounter: typeof setLicenseLimitCounter;
	getCurrentValueForLicenseLimit: typeof getCurrentValueForLicenseLimit;
	isLimitReached: <T extends LicenseLimitKind>(action: T, context?: Partial<LimitContext<T>>) => Promise<boolean>;
	onValidFeature: typeof onValidFeature;
	onInvalidFeature: typeof onInvalidFeature;
	onToggledFeature: typeof onToggledFeature;
	onModule: typeof onModule;
	onValidateLicense: typeof onValidateLicense;
	onInvalidateLicense: typeof onInvalidateLicense;
	onLimitReached: typeof onLimitReached;
	onBehaviorTriggered: typeof onBehaviorTriggered;
	revalidateLicense: () => Promise<void>;

	getInfo: (info: { limits: boolean; currentValues: boolean; license: boolean }) => Promise<LicenseInfo>;

	// Deprecated:
	onLicense: typeof onLicense;
	// Deprecated:
	getMaxActiveUsers: typeof getMaxActiveUsers;
	// Deprecated:
	getAppsConfig: typeof getAppsConfig;
	// Deprecated:
	getUnmodifiedLicenseAndModules: typeof getUnmodifiedLicenseAndModules;
}

export class LicenseImp extends LicenseManager implements License {
	validateFormat = validateFormat;

	hasModule = hasModule;

	getModules = getModules;

	getTags = getTags;

	overwriteClassOnLicense = overwriteClassOnLicense;

	public setLicenseLimitCounter = setLicenseLimitCounter;

	getCurrentValueForLicenseLimit = getCurrentValueForLicenseLimit;

	public async isLimitReached<T extends LicenseLimitKind>(action: T, context?: Partial<LimitContext<T>>): Promise<boolean> {
		return this.shouldPreventAction(action, 0, context);
	}

	onChange = onChange;

	onValidFeature = onValidFeature;

	onInvalidFeature = onInvalidFeature;

	onToggledFeature = onToggledFeature;

	onModule = onModule;

	onValidateLicense = onValidateLicense;

	onInvalidateLicense = onInvalidateLicense;

	onLimitReached = onLimitReached;

	onBehaviorTriggered = onBehaviorTriggered;

	onBehaviorToggled = onBehaviorToggled;

	// Deprecated:
	onLicense = onLicense;

	// Deprecated:
	getMaxActiveUsers = getMaxActiveUsers;

	// Deprecated:
	getAppsConfig = getAppsConfig;

	// Deprecated:
	getUnmodifiedLicenseAndModules = getUnmodifiedLicenseAndModules;
}

const license = new LicenseImp();

export { license as License };
