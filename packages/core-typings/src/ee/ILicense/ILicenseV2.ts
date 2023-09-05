import type { ILicenseV2Tag } from './ILicenseV2Tag';

export interface ILicenseV2 {
	url: string;
	expiry: string;
	maxActiveUsers: number;
	modules: string[];
	maxGuestUsers: number;
	maxRoomsPerGuest: number;
	tag?: ILicenseV2Tag;
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
