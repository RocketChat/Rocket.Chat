import type { ILicenseTag } from './ILicenseTag.js';
import type { ExternalModule, ILicenseV3, LicenseLimitKind } from './ILicenseV3.js';
import type { LicenseModule } from './LicenseModule.js';
import type { ICloudSyncAnnouncement } from '../cloud/index.js';

export type LicenseInfo = {
	license?: ILicenseV3;
	activeModules: LicenseModule[];
	externalModules: ExternalModule[];
	preventedActions: Record<LicenseLimitKind, boolean>;
	limits: Record<LicenseLimitKind, { value?: number; max: number }>;
	tags: ILicenseTag[];
	trial: boolean;
	hasValidLicense: boolean;
	cloudSyncAnnouncement?: ICloudSyncAnnouncement;
};
