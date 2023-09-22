/* eslint-disable @typescript-eslint/naming-convention */

import type { IBanner } from '../IBanner';
import type { Announcement } from './Announcement';
import type { NpsSurveyAnnouncement } from './NpsSurveyAnnouncement';

export interface WorkspaceSyncPayload {
	workspaceId: string;
	publicKey?: string;
	announcements?: {
		create: Announcement[];
		delete: Announcement['_id'][];
	};
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
