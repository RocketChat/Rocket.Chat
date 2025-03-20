import type { ILicenseTag } from './ILicenseTag';

export interface ILicenseV2 {
	url: string;
	expiry: string;
	maxActiveUsers: number;
	modules: string[];
	maxGuestUsers: number;
	maxRoomsPerGuest: number;
	tag?: ILicenseTag;
	meta?: {
		trial: boolean;
		trialEnd: string;
		workspaceId: string;
	};
	apps?: {
		maxPrivateApps: number;
		maxMarketplaceApps: number;
	};
}

export type LicenseAppSources = 'private' | 'marketplace';
