import { EventEmitter } from 'events';

import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { Apps } from '@rocket.chat/core-services';
import type {
	ILicenseV2,
	ILicenseTag,
	ILicenseV3,
	Timestamp,
	LicenseBehavior,
	IUser,
	LicenseLimit,
	LicensePeriod,
	LicenseLimitKind,
	LicenseModule,
} from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Users, Subscriptions } from '@rocket.chat/models';

import { getInstallationSourceFromAppStorageItem } from '../../../../lib/apps/getInstallationSourceFromAppStorageItem';
import decrypt from './decrypt';
import { fromV2toV3 } from './fromV2toV3';
import { getAppCount } from './lib/getAppCount';

const EnterpriseLicenses = new EventEmitter();

const logger = new Logger('License');

type LimitContext<T extends LicenseLimitKind> = T extends 'roomsPerGuest' ? { userId: IUser['_id'] } : Record<string, never>;

type BehaviorWithContext = {
	behavior: LicenseBehavior;
	modules?: LicenseModule[];
};

class LicenseClass {
	private url: string | null = null;

	private encryptedLicense: string | undefined;

	private tags = new Set<ILicenseTag>();

	private modules = new Set<LicenseModule>();

	private unmodifiedLicense: ILicenseV2 | ILicenseV3 | undefined;

	private license: ILicenseV3 | undefined;

	private valid: boolean | undefined;

	private inFairPolicy: boolean | undefined;

	private _isPeriodInvalid(from?: Timestamp, until?: Timestamp): boolean {
		const now = new Date();

		if (from && now < new Date(from)) {
			return true;
		}

		if (until && now > new Date(until)) {
			return true;
		}

		return false;
	}

	private _validateURL(licenseURL: string, url: string): boolean {
		licenseURL = licenseURL
			.replace(/\./g, '\\.') // convert dots to literal
			.replace(/\*/g, '.*'); // convert * to .*
		const regex = new RegExp(`^${licenseURL}$`, 'i');

		return !!regex.exec(url);
	}

	private _validModules(licenseModules: LicenseModule[]): void {
		licenseModules.forEach((module) => {
			this.modules.add(module);
			EnterpriseLicenses.emit('module', { module, valid: true });
			EnterpriseLicenses.emit(`valid:${module}`);
		});
	}

	private _invalidModules(licenseModules: LicenseModule[]): void {
		licenseModules.forEach((module) => {
			EnterpriseLicenses.emit('module', { module, valid: false });
			EnterpriseLicenses.emit(`invalid:${module}`);
			this.modules.delete(module);
		});
	}

	private _addTag(tag: ILicenseTag): void {
		// make sure to not add duplicated tag names
		for (const addedTag of this.tags) {
			if (addedTag.name.toLowerCase() === tag.name.toLowerCase()) {
				return;
			}
		}

		this.tags.add(tag);
	}

	private removeCurrentLicense(): void {
		const { license, valid } = this;

		this.license = undefined;
		this.unmodifiedLicense = undefined;
		this.valid = undefined;
		this.inFairPolicy = undefined;

		if (!license || !valid) {
			return;
		}

		this.valid = false;
		EnterpriseLicenses.emit('invalidate');
		this._invalidModules([...this.modules]);
		this.modules.clear();
	}

	public async setLicenseV3(license: ILicenseV3): Promise<void> {
		this.removeCurrentLicense();

		this.unmodifiedLicense = license;
		this.license = license;

		return this.validate();
	}

	public async setLicenseV2(license: ILicenseV2): Promise<void> {
		this.removeCurrentLicense();

		const licenseV3 = fromV2toV3(license);

		this.unmodifiedLicense = license;
		this.license = licenseV3;

		return this.validate();
	}

	public lockLicense(encryptedLicense: string): void {
		this.encryptedLicense = encryptedLicense;
	}

	public isLicenseDuplicate(encryptedLicense: string): boolean {
		return Boolean(this.encryptedLicense && this.encryptedLicense === encryptedLicense);
	}

	public hasModule(module: LicenseModule): boolean {
		return this.modules.has(module);
	}

	public hasValidLicense(): boolean {
		return Boolean(this.license && this.valid);
	}

	public getUnmodifiedLicenseAndModules(): { license: ILicenseV2 | ILicenseV3; modules: LicenseModule[] } | undefined {
		if (this.valid && this.unmodifiedLicense) {
			return {
				license: this.unmodifiedLicense,
				modules: [...this.modules],
			};
		}
	}

	public getLicense(): ILicenseV3 | undefined {
		if (this.valid && this.license) {
			return this.license;
		}
	}

	public getModules(): LicenseModule[] {
		return [...this.modules];
	}

	public getTags(): ILicenseTag[] {
		return [...this.tags];
	}

	public async setURL(url: string): Promise<void> {
		this.url = url.replace(/\/$/, '').replace(/^https?:\/\/(.*)$/, '$1');

		await this.validate();
	}

	private getResultingBehavior(data: LicenseLimit | LicensePeriod | Partial<BehaviorWithContext>): BehaviorWithContext {
		const behavior = 'invalidBehavior' in data ? data.invalidBehavior : data.behavior;

		switch (behavior) {
			case 'disable_modules':
				return {
					behavior,
					modules: ('modules' in data && data.modules) || [],
				};

			default:
				return {
					behavior,
				} as BehaviorWithContext;
		}
	}

	private filterValidationResult(result: BehaviorWithContext[], expectedBehavior: LicenseBehavior): BehaviorWithContext[] {
		return result.filter(({ behavior }) => behavior === expectedBehavior) as BehaviorWithContext[];
	}

	private isBehaviorsInResult(result: BehaviorWithContext[], expectedBehaviors: LicenseBehavior[]): boolean {
		return result.some(({ behavior }) => expectedBehaviors.includes(behavior));
	}

	private getModulesToDisable(validationResult: BehaviorWithContext[]): LicenseModule[] {
		return [
			...new Set([
				...this.filterValidationResult(validationResult, 'disable_modules')
					.map(({ modules }) => modules || [])
					.reduce((prev, curr) => [...prev, ...curr], []),
			]),
		];
	}

	private validateLicenseUrl(license: ILicenseV3, behaviorFilter: (behavior: LicenseBehavior) => boolean): BehaviorWithContext[] {
		if (!behaviorFilter('invalidate_license')) {
			return [];
		}

		const {
			validation: { serverUrls },
		} = license;

		const { url: workspaceUrl } = this;

		if (!workspaceUrl) {
			logger.error('Unable to validate license URL without knowing the workspace URL.');
			return [this.getResultingBehavior({ behavior: 'invalidate_license' })];
		}

		return serverUrls
			.filter((url) => {
				switch (url.type) {
					case 'regex':
						// #TODO
						break;
					case 'hash':
						// #TODO
						break;
					case 'url':
						return !this._validateURL(url.value, workspaceUrl);
				}

				return false;
			})
			.map((url) => {
				logger.error({
					msg: 'Url validation failed',
					url,
					workspaceUrl,
				});
				return this.getResultingBehavior({ behavior: 'invalidate_license' });
			});
	}

	private validateLicensePeriods(license: ILicenseV3, behaviorFilter: (behavior: LicenseBehavior) => boolean): BehaviorWithContext[] {
		const {
			validation: { validPeriods },
		} = license;

		return validPeriods
			.filter(
				({ validFrom, validUntil, invalidBehavior }) => behaviorFilter(invalidBehavior) && this._isPeriodInvalid(validFrom, validUntil),
			)
			.map((period) => {
				logger.error({
					msg: 'Period validation failed',
					period,
				});
				return this.getResultingBehavior(period);
			});
	}

	private async validateLicenseLimits(
		license: ILicenseV3,
		behaviorFilter: (behavior: LicenseBehavior) => boolean,
	): Promise<BehaviorWithContext[]> {
		const { limits } = license;

		const limitKeys = Object.keys(limits) as (keyof ILicenseV3['limits'])[];
		return (
			await Promise.all(
				limitKeys.map(async (limitKey) => {
					// Filter the limit list before running any query in the database so we don't end up loading some value we won't use.
					const limitList = limits[limitKey]?.filter(({ behavior, max }) => max >= 0 && behaviorFilter(behavior));
					if (!limitList?.length) {
						return [];
					}

					const currentValue = await this.getCurrentValueForLicenseLimit(limitKey);
					return limitList
						.filter(({ max }) => max < currentValue)
						.map((limit) => {
							logger.error({
								msg: 'Limit validation failed',
								kind: limitKey,
								limit,
							});
							return this.getResultingBehavior(limit);
						});
				}),
			)
		).reduce((prev, curr) => [...prev, ...curr], []);
	}

	private async shouldPreventAction<T extends LicenseLimitKind>(
		action: T,
		context?: Partial<LimitContext<T>>,
		newCount = 1,
	): Promise<boolean> {
		if (!this.valid) {
			return false;
		}

		const currentValue = (await this.getCurrentValueForLicenseLimit(action, context)) + newCount;
		return Boolean(
			this.license?.limits[action]
				?.filter(({ behavior, max }) => behavior === 'prevent_action' && max >= 0)
				.some(({ max }) => max < currentValue),
		);
	}

	private async runValidation(license: ILicenseV3, behaviorsToValidate: LicenseBehavior[] = []): Promise<BehaviorWithContext[]> {
		const shouldValidateBehavior = (behavior: LicenseBehavior) => !behaviorsToValidate?.length || behaviorsToValidate.includes(behavior);

		return [
			...new Set([
				...this.validateLicenseUrl(license, shouldValidateBehavior),
				...this.validateLicensePeriods(license, shouldValidateBehavior),
				...(await this.validateLicenseLimits(license, shouldValidateBehavior)),
			]),
		];
	}

	private async validate(): Promise<void> {
		if (this.license) {
			// #TODO: Only include 'prevent_installation' here if this is actually the initial installation of the license
			const behaviorsTriggered = await this.runValidation(this.license, [
				'invalidate_license',
				'prevent_installation',
				'start_fair_policy',
				'disable_modules',
			]);

			if (this.isBehaviorsInResult(behaviorsTriggered, ['invalidate_license', 'prevent_installation'])) {
				return;
			}

			this.valid = true;
			this.inFairPolicy = this.isBehaviorsInResult(behaviorsTriggered, ['start_fair_policy']);

			if (this.license.information.tags) {
				for (const tag of this.license.information.tags) {
					this._addTag(tag);
				}
			}

			const disabledModules = this.getModulesToDisable(behaviorsTriggered);
			const modulesToEnable = this.license.grantedModules.filter(({ module }) => !disabledModules.includes(module));

			this._validModules(modulesToEnable.map(({ module }) => module));
			console.log('#### License validated:', modulesToEnable.join(', '));
		}

		EnterpriseLicenses.emit('validate');
		this.showLicense();
	}

	private async getCurrentValueForLicenseLimit<T extends LicenseLimitKind>(
		limitKey: T,
		context?: Partial<LimitContext<T>>,
	): Promise<number> {
		switch (limitKey) {
			case 'activeUsers':
				return this.getCurrentActiveUsers();
			case 'guestUsers':
				return this.getCurrentGuestUsers();
			case 'privateApps':
				return this.getCurrentPrivateAppsCount();
			case 'marketplaceApps':
				return this.getCurrentMarketplaceAppsCount();
			case 'roomsPerGuest':
				if (context?.userId) {
					return Subscriptions.countByUserId(context.userId);
				}
				return 0;
			default:
				return 0;
		}
	}

	private async getCurrentActiveUsers(): Promise<number> {
		return Users.getActiveLocalUserCount();
	}

	private async getCurrentGuestUsers(): Promise<number> {
		return Users.getActiveLocalGuestCount();
	}

	private async getCurrentPrivateAppsCount(): Promise<number> {
		return getAppCount('private');
	}

	private async getCurrentMarketplaceAppsCount(): Promise<number> {
		return getAppCount('marketplace');
	}

	public async canAddNewUser(userCount = 1): Promise<boolean> {
		return !(await this.shouldPreventAction('activeUsers', {}, userCount));
	}

	public async canAddNewGuestUser(guestCount = 1): Promise<boolean> {
		return !(await this.shouldPreventAction('guestUsers', {}, guestCount));
	}

	public async canAddNewPrivateApp(appCount = 1): Promise<boolean> {
		return !(await this.shouldPreventAction('privateApps', {}, appCount));
	}

	public async canAddNewMarketplaceApp(appCount = 1): Promise<boolean> {
		return !(await this.shouldPreventAction('marketplaceApps', {}, appCount));
	}

	public async canAddNewGuestSubscription(guest: IUser['_id'], roomCount = 1): Promise<boolean> {
		return !(await this.shouldPreventAction('roomsPerGuest', { userId: guest }, roomCount));
	}

	public async canEnableApp(app: IAppStorageItem): Promise<boolean> {
		if (!(await Apps.isInitialized())) {
			return false;
		}

		// Migrated apps were installed before the validation was implemented
		// so they're always allowed to be enabled
		if (app.migrated) {
			return true;
		}

		const source = getInstallationSourceFromAppStorageItem(app);
		switch (source) {
			case 'private':
				return this.canAddNewPrivateApp();
			default:
				return this.canAddNewMarketplaceApp();
		}
	}

	private showLicense(): void {
		if (!process.env.LICENSE_DEBUG || process.env.LICENSE_DEBUG === 'false') {
			return;
		}

		if (!this.license || !this.valid) {
			return;
		}

		const {
			validation: { serverUrls, validPeriods },
			limits,
		} = this.license;

		console.log('---- License enabled ----');
		console.log('              url ->', JSON.stringify(serverUrls));
		console.log('          periods ->', JSON.stringify(validPeriods));
		console.log('           limits ->', JSON.stringify(limits));
		console.log('          modules ->', [...this.modules].join(', '));
		console.log('-------------------------');
	}

	public startedFairPolicy(): boolean {
		return Boolean(this.valid && this.inFairPolicy);
	}

	public getLicenseLimit(kind: LicenseLimitKind): number | undefined {
		if (!this.valid || !this.license) {
			return;
		}

		const limitList = this.license.limits[kind];
		if (!limitList?.length) {
			return;
		}

		return Math.min(...limitList.map(({ max }) => max));
	}
}

const License = new LicenseClass();

export async function setLicense(encryptedLicense: string): Promise<boolean> {
	if (!encryptedLicense || String(encryptedLicense).trim() === '' || License.isLicenseDuplicate(encryptedLicense)) {
		return false;
	}

	console.log('### New Enterprise License');

	try {
		const decrypted = decrypt(encryptedLicense);
		if (!decrypted) {
			return false;
		}

		if (process.env.LICENSE_DEBUG && process.env.LICENSE_DEBUG !== 'false') {
			console.log('##### Raw license ->', decrypted);
		}

		// #TODO: Check license version and call setLicenseV2 or setLicenseV3
		await License.setLicenseV2(JSON.parse(decrypted));
		License.lockLicense(encryptedLicense);

		return true;
	} catch (e) {
		console.error('##### Invalid license');
		if (process.env.LICENSE_DEBUG && process.env.LICENSE_DEBUG !== 'false') {
			console.error('##### Invalid raw license ->', encryptedLicense, e);
		}
		return false;
	}
}

export function validateFormat(encryptedLicense: string): boolean {
	if (!encryptedLicense || String(encryptedLicense).trim() === '') {
		return false;
	}

	const decrypted = decrypt(encryptedLicense);
	if (!decrypted) {
		return false;
	}

	return true;
}

export async function setURL(url: string): Promise<void> {
	await License.setURL(url);
}

export function hasLicense(feature: string): boolean {
	return License.hasModule(feature as LicenseModule);
}

export function isEnterprise(): boolean {
	return License.hasValidLicense();
}

export function getMaxActiveUsers(): number {
	// #TODO: Adjust any place currently using this function to stop doing so.
	return License.getLicenseLimit('activeUsers') ?? 0;
}

export function getUnmodifiedLicenseAndModules(): { license: ILicenseV2 | ILicenseV3; modules: LicenseModule[] } | undefined {
	return License.getUnmodifiedLicenseAndModules();
}

export function getLicense(): ILicenseV3 | undefined {
	return License.getLicense();
}

export function getModules(): LicenseModule[] {
	return License.getModules();
}

export function getTags(): ILicenseTag[] {
	return License.getTags();
}

export function getAppsConfig(): NonNullable<ILicenseV2['apps']> {
	// #TODO: Adjust any place currently using this function to stop doing so.
	return {
		maxPrivateApps: License.getLicenseLimit('privateApps') ?? -1,
		maxMarketplaceApps: License.getLicenseLimit('marketplaceApps') ?? -1,
	};
}

export async function canAddNewUser(userCount = 1): Promise<boolean> {
	return License.canAddNewUser(userCount);
}

export async function canAddNewGuestUser(guestCount = 1): Promise<boolean> {
	return License.canAddNewGuestUser(guestCount);
}

export async function canAddNewGuestSubscription(guest: IUser['_id'], roomCount = 1): Promise<boolean> {
	return License.canAddNewGuestSubscription(guest, roomCount);
}

export async function canAddNewPrivateApp(appCount = 1): Promise<boolean> {
	return License.canAddNewPrivateApp(appCount);
}

export async function canAddNewMarketplaceApp(appCount = 1): Promise<boolean> {
	return License.canAddNewMarketplaceApp(appCount);
}

export async function canEnableApp(app: IAppStorageItem): Promise<boolean> {
	return License.canEnableApp(app);
}

export function onLicense(feature: LicenseModule, cb: (...args: any[]) => void): void | Promise<void> {
	if (hasLicense(feature)) {
		return cb();
	}

	EnterpriseLicenses.once(`valid:${feature}`, cb);
}

function onValidFeature(feature: LicenseModule, cb: () => void): () => void {
	EnterpriseLicenses.on(`valid:${feature}`, cb);

	if (hasLicense(feature)) {
		cb();
	}

	return (): void => {
		EnterpriseLicenses.off(`valid:${feature}`, cb);
	};
}

function onInvalidFeature(feature: LicenseModule, cb: () => void): () => void {
	EnterpriseLicenses.on(`invalid:${feature}`, cb);

	if (!hasLicense(feature)) {
		cb();
	}

	return (): void => {
		EnterpriseLicenses.off(`invalid:${feature}`, cb);
	};
}

export function onToggledFeature(
	feature: LicenseModule,
	{
		up,
		down,
	}: {
		up?: () => Promise<void> | void;
		down?: () => Promise<void> | void;
	},
): () => void {
	let enabled = hasLicense(feature);

	const offValidFeature = onValidFeature(feature, () => {
		if (!enabled) {
			void up?.();
			enabled = true;
		}
	});

	const offInvalidFeature = onInvalidFeature(feature, () => {
		if (enabled) {
			void down?.();
			enabled = false;
		}
	});

	if (enabled) {
		void up?.();
	}

	return (): void => {
		offValidFeature();
		offInvalidFeature();
	};
}

export function onModule(cb: (...args: any[]) => void): void {
	EnterpriseLicenses.on('module', cb);
}

export function onValidateLicenses(cb: (...args: any[]) => void): void {
	EnterpriseLicenses.on('validate', cb);
}

export function onInvalidateLicense(cb: (...args: any[]) => void): void {
	EnterpriseLicenses.on('invalidate', cb);
}

interface IOverrideClassProperties {
	[key: string]: (...args: any[]) => any;
}

type Class = { new (...args: any[]): any };

export async function overwriteClassOnLicense(license: LicenseModule, original: Class, overwrite: IOverrideClassProperties): Promise<void> {
	await onLicense(license, () => {
		Object.entries(overwrite).forEach(([key, value]) => {
			const originalFn = original.prototype[key];
			original.prototype[key] = function (...args: any[]): any {
				return value.call(this, originalFn, ...args);
			};
		});
	});
}
