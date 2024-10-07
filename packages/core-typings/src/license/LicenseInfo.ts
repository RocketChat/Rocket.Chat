import type { ILicenseTag } from './ILicenseTag';
import type { ExternalModule, ILicenseV3, LicenseLimitKind } from './ILicenseV3';

export type LicenseInfo = {
	license?: ILicenseV3;
	activeModules: string[];
	externalModules: ExternalModule[];
	preventedActions: Record<LicenseLimitKind, boolean>;
	limits: Record<LicenseLimitKind, { value?: number; max: number }>;
	tags: ILicenseTag[];
	trial: boolean;
};
