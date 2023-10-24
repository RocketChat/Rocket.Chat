import type { ILicenseTag } from './ILicenseTag';
import type { ILicenseV3, LicenseLimitKind } from './ILicenseV3';
import type { LicenseModule } from './LicenseModule';

export type LicenseInfo = {
	license?: ILicenseV3;
	activeModules: LicenseModule[];
	preventedActions: Record<LicenseLimitKind, boolean>;
	limits: Record<LicenseLimitKind, { value?: number; max: number }>;
	tags: ILicenseTag[];
	trial: boolean;
};
