import type { SignedSupportedVersions } from '@rocket.chat/server-cloud-communication';

import type { ILicenseTag } from './ILicenseTag';
import type { LicenseLimit } from './LicenseLimit';
import type { LicenseModule } from './LicenseModule';
import type { LicensePeriod, Timestamp } from './LicensePeriod';

export interface ILicenseV3 {
	version: '3.0';
	information: {
		id?: string;
		autoRenew: boolean;
		visualExpiration: Timestamp;
		notifyAdminsAt?: Timestamp;
		notifyUsersAt?: Timestamp;
		trial: boolean;
		offline: boolean;
		createdAt: Timestamp;
		grantedBy: {
			method: 'manual' | 'self-service' | 'sales' | 'support' | 'reseller';
			seller?: string;
		};
		grantedTo?: {
			name?: string;
			company?: string;
			email?: string;
		};
		legalText?: string;
		notes?: string;
		tags?: ILicenseTag[];
	};
	validation: {
		serverUrls: {
			value: string;
			type: 'url' | 'regex' | 'hash';
		}[];
		serverVersions?: {
			value: string;
		}[];
		serverUniqueId?: string;
		cloudWorkspaceId?: string;
		validPeriods: LicensePeriod[];
		legalTextAgreement?: {
			type: 'required' | 'not-required' | 'accepted';
			acceptedVia?: 'cloud';
		};
		statisticsReport: {
			required: boolean;
			allowedStaleInDays?: number;
		};
	};
	grantedModules: {
		module: LicenseModule;
	}[];
	limits: {
		activeUsers?: LicenseLimit[];
		guestUsers?: LicenseLimit[];
		roomsPerGuest?: LicenseLimit<'prevent_action'>[];
		privateApps?: LicenseLimit[];
		marketplaceApps?: LicenseLimit[];
		monthlyActiveContacts?: LicenseLimit[];
	};
	cloudMeta?: Record<string, any>;

	supportedVersions?: SignedSupportedVersions;
}

export type LicenseLimitKind = keyof ILicenseV3['limits'];
