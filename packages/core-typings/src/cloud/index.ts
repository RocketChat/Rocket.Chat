/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/naming-convention */

import type { IBanner } from '../IBanner';

export interface Announcement {
	id: string;
}

export interface NpsSurveyAnnouncement {
	id: string;
	startAt: Date;
	expireAt: Date;
}

export interface SyncPayload {
	workspaceId: string;
	publicKey?: string;
	announcements?: {
		create: Announcement[];
		delete: Announcement['id'][];
	};
	trial?: {
		trialing: boolean;
		trialId: string;
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
