/* eslint-disable @typescript-eslint/naming-convention */
import type { ILicenseV3 } from '@rocket.chat/license';

import type { SupportedVersions, SignedSupportedVersions } from './definitions';

export { SupportedVersions, SignedSupportedVersions };

export interface WorkspaceSyncRequestPayload {
	uniqueId: string;
	workspaceId: string;
	seats: number;
	MAC: number; // Need to align on the property
	address: string;
	siteName: string;
	deploymentMethod: string;
	deploymentPlatform: string;
	version: string;
	licenseVersion: number;

	connectionDisable: boolean;
}

export interface WorkspaceSyncResponse {
	workspaceId: string;
	publicKey: string;
	license: ILicenseV3;
}
