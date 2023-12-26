import type { ILicenseTag, ILicenseV3, LicenseLimit, LicenseModule, LicensePeriod, Timestamp } from '@rocket.chat/core-typings';

import { encrypt } from './token';

export class MockedLicenseBuilder {
	information: {
		id?: string;
		autoRenew: boolean;
		visualExpiration?: Timestamp;
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

	constructor() {
		this.information = {
			autoRenew: true,
			// expires in 1 year
			visualExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
			// 15 days before expiration
			notifyAdminsAt: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
			// 30 days before expiration
			notifyUsersAt: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
			trial: false,
			offline: false,
			createdAt: new Date().toISOString(),
			grantedBy: {
				method: 'manual',
				seller: 'Rocket.Cat',
			},
			tags: [
				{
					name: 'Test',
					color: 'blue',
				},
			],
		};

		this.validation = {
			serverUrls: [
				{
					value: 'localhost:3000',
					type: 'url',
				},
			],
			serverVersions: [
				{
					value: '3.0.0',
				},
			],

			serverUniqueId: '1234567890',
			cloudWorkspaceId: '1234567890',

			validPeriods: [
				{
					invalidBehavior: 'disable_modules',
					modules: ['livechat-enterprise'],
					validFrom: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
					validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
				},
			],

			statisticsReport: {
				required: true,
				allowedStaleInDays: 30,
			},
		};
	}

	public withExpiredDate(): this {
		// expired 1 minute ago
		const date = new Date();
		date.setMinutes(date.getMinutes() - 1);
		const expired = date.toISOString();

		const rule = this.validation.validPeriods.find((period) => period.invalidBehavior === 'invalidate_license');

		if (rule) {
			rule.validUntil = expired;
		} else {
			this.validation.validPeriods.push({
				invalidBehavior: 'invalidate_license',
				validFrom: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(),
				validUntil: expired,
			});
		}

		return this;
	}

	public withNotStartedDate(): this {
		// starts in 1 minute
		const date = new Date();
		date.setMinutes(date.getMinutes() + 1);
		const starts = date.toISOString();

		const rule = this.validation.validPeriods.find((period) => period.invalidBehavior === 'invalidate_license');

		if (rule) {
			rule.validFrom = starts;
		} else {
			this.validation.validPeriods.push({
				invalidBehavior: 'invalidate_license',
				validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
				validFrom: starts,
			});
		}

		return this;
	}

	public resetValidPeriods(): this {
		this.validation.validPeriods = [];
		return this;
	}

	public withValidPeriod(period: LicensePeriod): this {
		this.validation.validPeriods.push(period);
		return this;
	}

	public withGrantedTo(grantedTo: { name?: string; company?: string; email?: string }): this {
		this.information.grantedTo = grantedTo;
		return this;
	}

	grantedModules: {
		module: LicenseModule;
	}[] = [];

	limits: {
		activeUsers?: LicenseLimit[];
		guestUsers?: LicenseLimit[];
		roomsPerGuest?: LicenseLimit<'prevent_action'>[];
		privateApps?: LicenseLimit[];
		marketplaceApps?: LicenseLimit[];
		monthlyActiveContacts?: LicenseLimit[];
	} = {};

	cloudMeta?: Record<string, any>;

	public withServerUrls(urls: { value: string; type: 'url' | 'regex' | 'hash' }): this {
		this.validation.serverUrls = this.validation.serverUrls ?? [];
		this.validation.serverUrls.push(urls);
		return this;
	}

	public withServerVersions(versions: { value: string }): this {
		this.validation.serverVersions = this.validation.serverVersions ?? [];
		this.validation.serverVersions.push(versions);
		return this;
	}

	public withGratedModules(modules: LicenseModule[]): this {
		this.grantedModules = this.grantedModules ?? [];
		this.grantedModules.push(...modules.map((module) => ({ module })));
		return this;
	}

	withNoGratedModules(modules: LicenseModule[]): this {
		this.grantedModules = this.grantedModules ?? [];
		this.grantedModules = this.grantedModules.filter(({ module }) => !modules.includes(module));
		return this;
	}

	public withLimits<K extends keyof ILicenseV3['limits']>(key: K, value: ILicenseV3['limits'][K]): this {
		this.limits = this.limits ?? {};
		this.limits[key] = value;
		return this;
	}

	public build(): ILicenseV3 {
		return {
			version: '3.0',
			information: this.information,
			validation: this.validation,
			grantedModules: [...new Set(this.grantedModules)],
			limits: {
				activeUsers: [],
				guestUsers: [],
				roomsPerGuest: [],
				privateApps: [],
				marketplaceApps: [],
				monthlyActiveContacts: [],
				...this.limits,
			},
			cloudMeta: this.cloudMeta,
		};
	}

	public sign(): Promise<string> {
		return encrypt(this.build());
	}
}
