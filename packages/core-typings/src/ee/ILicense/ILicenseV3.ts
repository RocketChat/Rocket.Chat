import type { ILicenseTag } from './ILicenseTag';

export type LicenseBehavior = 'invalidate_license' | 'start_fair_policy' | 'prevent_action' | 'prevent_installation';

export type LicenseLimit<T extends LicenseBehavior = LicenseBehavior> = {
	max: number;
	behavior: T;
};

export type Timestamp = string;

export type LicensePeriod = {
	validFrom?: Timestamp;
	validUntil?: Timestamp;
	invalidBehavior: Exclude<LicenseBehavior, 'prevent_action'>;
} & ({ validFrom: Timestamp } | { validUntil: Timestamp });

export type Module =
	| 'auditing'
	| 'canned-responses'
	| 'ldap-enterprise'
	| 'livechat-enterprise'
	| 'voip-enterprise'
	| 'omnichannel-mobile-enterprise'
	| 'engagement-dashboard'
	| 'push-privacy'
	| 'scalability'
	| 'teams-mention'
	| 'saml-enterprise'
	| 'oauth-enterprise'
	| 'device-management'
	| 'federation'
	| 'videoconference-enterprise'
	| 'message-read-receipt'
	| 'outlook-calendar';

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
		module: Module;
	}[];
	limits: {
		activeUsers?: LicenseLimit[];
		guestUsers?: LicenseLimit[];
		roomsPerGuest?: LicenseLimit<'prevent_action'>[];
		privateApps?: LicenseLimit[];
		marketplaceApps?: LicenseLimit[];
	};
	cloudMeta?: Record<string, any>;
}
