import { ILicenseTag } from './ILicenseTag';

export interface ILicense {
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
}
