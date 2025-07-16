import type { ILicenseTag } from './ILicenseTag';
import type { LicenseLimit } from './LicenseLimit';
import type { ExternalModuleName, InternalModuleName } from './LicenseModule';
import type { LicensePeriod, Timestamp } from './LicensePeriod';

export type InternalModule = { module: InternalModuleName; external?: false };
export type ExternalModule = { module: ExternalModuleName; external: true };

export type GrantedModules = (InternalModule | ExternalModule)[];

export interface ILicenseV3 {
	version: '3.0';
	information: {
		id?: string;
		autoRenew: boolean;
		visualExpiration?: Timestamp;
		notifyAdminsAt?: Timestamp;
		notifyUsersAt?: Timestamp;
		trial: boolean;
		cancellable?: boolean;
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
	grantedModules: GrantedModules;
	limits: {
		activeUsers?: LicenseLimit[];
		guestUsers?: LicenseLimit[];
		roomsPerGuest?: LicenseLimit<'prevent_action'>[];
		privateApps?: LicenseLimit[];
		marketplaceApps?: LicenseLimit[];
		monthlyActiveContacts?: LicenseLimit[];
	};
	cloudMeta?: Record<string, any>;
}

export type LicenseLimitKind = keyof ILicenseV3['limits'];
