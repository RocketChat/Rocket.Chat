import { licenseData } from './data';
import { overwriteClassOnLicense } from './events/overwriteClassOnLicense';
import { getLicense, hasValidLicense, setLicense } from './license';
import { modules as modulesData, hasModule, getModules } from './modules';
import { tags as tagsData, getTags } from './tags';
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

const { modules, tags, data } = process.env.TEST_MODE
	? { modules: modulesData, tags: tagsData, data: licenseData }
	: { modules: undefined, tags: undefined, data: undefined };

export {
	setLicense,
	validateFormat,
	setWorkspaceUrl,
	hasModule,
	hasValidLicense,
	getLicense,
	modules,
	getModules,
	tags,
	getTags,
	overwriteClassOnLicense,
	setLicenseLimitCounter,
	getCurrentValueForLicenseLimit,
	data,
};
