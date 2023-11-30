/* eslint-disable @typescript-eslint/naming-convention */

import type { UiKit } from '..';
import type { IBanner } from '../IBanner';
import type { NpsSurveyAnnouncement } from './NpsSurveyAnnouncement';

export interface WorkspaceSyncPayload {
	workspaceId: string;
	publicKey?: string;
	trial?: {
		trialing: boolean;
		trialID: string;
		endDate: Date;
		marketing: {
			utmContent: string;
			utmMedium: string;
			utmSource: string;
			utmCampaign: string;
		};
		DowngradesToPlan: {
			id: string;
		};
		trialRequested: boolean;
	};
	/** @deprecated */
	nps?: NpsSurveyAnnouncement;
	/** @deprecated */
	banners?: IBanner[];
}

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
	license: unknown;
}

export interface WorkspaceCommsRequestPayload {
	npsEnabled: boolean;
	deploymentMethod: string;
	deploymentPlatform: string;
	version: string;
}

export interface WorkspaceCommsResponsePayload {
	nps?: NpsSurveyAnnouncement | null; // Potentially consolidate into announcements
	announcements?: {
		create: IBanner[];
		delete: IBanner['_id'][];
	};
}

export interface WorkspaceInteractionResponsePayload {
	serverInteraction: UiKit.ServerInteraction;
	serverAction?: 'syncWorkspace';
}
