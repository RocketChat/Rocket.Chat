import { EventEmitter } from 'events';

import { Apps } from '@rocket.chat/core-services';
import type { IEnterpriseAdapter } from '@rocket.chat/core-services';
import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { Users } from '@rocket.chat/models';

import type { BundleFeature } from './bundles';
import { getBundleModules, isBundle, getBundleFromModule } from './bundles';
import decrypt from './decrypt';
import { getTagColor } from './getTagColor';
import type { ILicense } from '../definition/ILicense';
import type { ILicenseTag } from '../definition/ILicenseTag';
import { isUnderAppLimits } from './lib/isUnderAppLimits';
import { getInstallationSourceFromAppStorageItem } from '../../../../lib/apps/getInstallationSourceFromAppStorageItem';

const EnterpriseLicenses = new EventEmitter();

interface IValidLicense {
	valid?: boolean;
	license: ILicense;
}

let maxGuestUsers = 0;
let maxRoomsPerGuest = 0;
let maxActiveUsers = 0;

class LicenseClass {
	private url: string | null = null;

	private licenses: IValidLicense[] = [];

	private encryptedLicenses = new Set<string>();

	private tags = new Set<ILicenseTag>();

	private modules = new Set<string>();

	private appsConfig: NonNullable<ILicense['apps']> = {
		maxPrivateApps: 3,
		maxMarketplaceApps: 5,
	};

	private _validateExpiration(expiration: string): boolean {
		return new Date() > new Date(expiration);
	}

	private _validateURL(licenseURL: string, url: string): boolean {
		licenseURL = licenseURL
			.replace(/\./g, '\\.') // convert dots to literal
			.replace(/\*/g, '.*'); // convert * to .*
		const regex = new RegExp(`^${licenseURL}$`, 'i');

		return !!regex.exec(url);
	}

	private _setAppsConfig(license: ILicense): void {
		// If the license is valid, no limit is going to be applied to apps installation for now
		// This guarantees that upgraded workspaces won't be affected by the new limit right away
		// and gives us time to propagate the new limit schema to all licenses
		const { maxPrivateApps = -1, maxMarketplaceApps = -1 } = license.apps || {};

		if (maxPrivateApps === -1 || maxPrivateApps > this.appsConfig.maxPrivateApps) {
			this.appsConfig.maxPrivateApps = maxPrivateApps;
		}

		if (maxMarketplaceApps === -1 || maxMarketplaceApps > this.appsConfig.maxMarketplaceApps) {
			this.appsConfig.maxMarketplaceApps = maxMarketplaceApps;
		}
	}

	private _validModules(licenseModules: string[]): void {
		licenseModules.forEach((licenseModule) => {
			const modules = isBundle(licenseModule) ? getBundleModules(licenseModule) : [licenseModule];

			modules.forEach((module) => {
				this.modules.add(module);
				EnterpriseLicenses.emit('module', { module, valid: true });
				EnterpriseLicenses.emit(`valid:${module}`);
			});
		});
	}

	private _invalidModules(licenseModules: string[]): void {
		licenseModules.forEach((licenseModule) => {
			const modules = isBundle(licenseModule) ? getBundleModules(licenseModule) : [licenseModule];

			modules.forEach((module) => {
				EnterpriseLicenses.emit('module', { module, valid: false });
				EnterpriseLicenses.emit(`invalid:${module}`);
			});
		});
	}

	private _addTags(license: ILicense): void {
		// if no tag present, it means it is an old license, so try check for bundles and use them as tags
		if (typeof license.tag === 'undefined') {
			license.modules
				.filter(isBundle)
				.map(getBundleFromModule)
				.forEach((tag) => tag && this._addTag({ name: tag, color: getTagColor(tag) }));
			return;
		}

		this._addTag(license.tag);
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

	addLicense(license: ILicense): void {
		this.licenses.push({
			valid: undefined,
			license,
		});

		this.validate();
	}

	lockLicense(encryptedLicense: string): void {
		this.encryptedLicenses.add(encryptedLicense);
	}

	isLicenseDuplicate(encryptedLicense: string): boolean {
		if (this.encryptedLicenses.has(encryptedLicense)) {
			return true;
		}

		return false;
	}

	hasModule(module: string): boolean {
		return this.modules.has(module);
	}

	hasAnyValidLicense(): boolean {
		return this.licenses.some((item) => item.valid);
	}

	getLicenses(): IValidLicense[] {
		return this.licenses;
	}

	getModules(): string[] {
		return [...this.modules];
	}

	getTags(): ILicenseTag[] {
		return [...this.tags];
	}

	getAppsConfig(): NonNullable<ILicense['apps']> {
		return this.appsConfig;
	}

	setURL(url: string): void {
		this.url = url.replace(/\/$/, '').replace(/^https?:\/\/(.*)$/, '$1');

		this.validate();
	}

	validate(): void {
		this.licenses = this.licenses.map((item) => {
			const { license } = item;

			if (license.url) {
				if (!this.url) {
					return item;
				}
				if (!this._validateURL(license.url, this.url)) {
					this.invalidate(item);
					console.error(`#### License error: invalid url, licensed to ${license.url}, used on ${this.url}`);
					this._invalidModules(license.modules);
					return item;
				}
			}

			if (license.expiry && this._validateExpiration(license.expiry)) {
				this.invalidate(item);
				console.error(`#### License error: expired, valid until ${license.expiry}`);
				this._invalidModules(license.modules);
				return item;
			}

			if (license.maxGuestUsers > maxGuestUsers) {
				maxGuestUsers = license.maxGuestUsers;
			}

			if (license.maxRoomsPerGuest > maxRoomsPerGuest) {
				maxRoomsPerGuest = license.maxRoomsPerGuest;
			}

			if (license.maxActiveUsers > maxActiveUsers) {
				maxActiveUsers = license.maxActiveUsers;
			}

			this._setAppsConfig(license);

			this._validModules(license.modules);

			this._addTags(license);

			console.log('#### License validated:', license.modules.join(', '));

			item.valid = true;
			return item;
		});

		EnterpriseLicenses.emit('validate');
		this.showLicenses();
	}

	invalidate(item: IValidLicense): void {
		item.valid = false;

		EnterpriseLicenses.emit('invalidate');
	}

	async canAddNewUser(): Promise<boolean> {
		if (!maxActiveUsers) {
			return true;
		}

		return maxActiveUsers > (await Users.getActiveLocalUserCount());
	}

	async canEnableApp(app: IAppStorageItem): Promise<boolean> {
		if (!(await Apps.isInitialized())) {
			return false;
		}

		// Migrated apps were installed before the validation was implemented
		// so they're always allowed to be enabled
		if (app.migrated) {
			return true;
		}

		return isUnderAppLimits(this.appsConfig, getInstallationSourceFromAppStorageItem(app));
	}

	showLicenses(): void {
		if (!process.env.LICENSE_DEBUG || process.env.LICENSE_DEBUG === 'false') {
			return;
		}

		this.licenses
			.filter((item) => item.valid)
			.forEach((item) => {
				const { license } = item;

				console.log('---- License enabled ----');
				console.log('              url ->', license.url);
				console.log('           expiry ->', license.expiry);
				console.log('   maxActiveUsers ->', license.maxActiveUsers);
				console.log('    maxGuestUsers ->', license.maxGuestUsers);
				console.log(' maxRoomsPerGuest ->', license.maxRoomsPerGuest);
				console.log('          modules ->', license.modules.join(', '));
				console.log('-------------------------');
			});
	}
}

const License = new LicenseClass();

export function addLicense(encryptedLicense: string): boolean {
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

		License.addLicense(JSON.parse(decrypted));
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

export function setURL(url: string): void {
	License.setURL(url);
}

export function hasLicense(feature: string): boolean {
	return License.hasModule(feature);
}

export function isEnterprise(): boolean {
	return License.hasAnyValidLicense();
}

export function getMaxGuestUsers(): number {
	return maxGuestUsers;
}

export function getMaxRoomsPerGuest(): number {
	return maxRoomsPerGuest;
}

export function getMaxActiveUsers(): number {
	return maxActiveUsers;
}

export function getLicenses(): IValidLicense[] {
	return License.getLicenses();
}

export function getModules(): string[] {
	return License.getModules();
}

export function getTags(): ILicenseTag[] {
	return License.getTags();
}

export function getAppsConfig(): NonNullable<ILicense['apps']> {
	return License.getAppsConfig();
}

export async function canAddNewUser(): Promise<boolean> {
	return License.canAddNewUser();
}

export async function canEnableApp(app: IAppStorageItem): Promise<boolean> {
	return License.canEnableApp(app);
}

export function onLicense(feature: BundleFeature, cb: (...args: any[]) => void): void {
	if (hasLicense(feature)) {
		return cb();
	}

	EnterpriseLicenses.once(`valid:${feature}`, cb);
}

function onValidFeature(feature: BundleFeature, cb: () => void): () => void {
	EnterpriseLicenses.on(`valid:${feature}`, cb);

	if (hasLicense(feature)) {
		cb();
	}

	return (): void => {
		EnterpriseLicenses.off(`valid:${feature}`, cb);
	};
}

function onInvalidFeature(feature: BundleFeature, cb: () => void): () => void {
	EnterpriseLicenses.on(`invalid:${feature}`, cb);

	if (!hasLicense(feature)) {
		cb();
	}

	return (): void => {
		EnterpriseLicenses.off(`invalid:${feature}`, cb);
	};
}

export function onToggledFeature(
	feature: BundleFeature,
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

export function flatModules(modulesAndBundles: string[]): string[] {
	const bundles = modulesAndBundles.filter(isBundle);
	const modules = modulesAndBundles.filter((x) => !isBundle(x));

	const modulesFromBundles = bundles.map(getBundleModules).flat();

	return modules.concat(modulesFromBundles);
}

interface IOverrideClassProperties {
	[key: string]: (...args: any[]) => any;
}

type Class = { new (...args: any[]): any };

export async function overwriteClassOnLicense(license: BundleFeature, original: Class, overwrite: IOverrideClassProperties): Promise<void> {
	await onLicense(license, () => {
		Object.entries(overwrite).forEach(([key, value]) => {
			const originalFn = original.prototype[key];
			original.prototype[key] = function (...args: any[]): any {
				return value.call(this, originalFn, ...args);
			};
		});
	});
}

export const enterpriseAdapter: IEnterpriseAdapter = {
	hasModuleEnabled: hasLicense,
	onModuleEnabled: onLicense,
};
