import { overwriteClassOnLicense } from './events/overwriteClassOnLicense';
import { getLicense, getUnmodifiedLicenseAndModules, hasValidLicense, setLicense } from './license';
import { hasModule, getModules } from './modules';
import { getTags } from './tags';
import { setLicenseLimitCounter, getCurrentValueForLicenseLimit } from './validation/getCurrentValueForLicenseLimit';
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

export * from './events/deprecated';
export * from './events/listeners';
export * from './deprecated';
export * from './actionBlockers';

export {
	setLicense,
	validateFormat,
	setWorkspaceUrl,
	hasModule,
	hasValidLicense,
	getUnmodifiedLicenseAndModules,
	getLicense,
	getModules,
	getTags,
	overwriteClassOnLicense,
	setLicenseLimitCounter,
	getCurrentValueForLicenseLimit,
};
