import { EventEmitter } from 'events';

import { Users } from '../../../../app/models/server';
import { getBundleModules, isBundle, getBundleFromModule, BundleFeature } from './bundles';
import decrypt from './decrypt';
import { getTagColor } from './getTagColor';
import { ILicense } from '../definitions/ILicense';
import { ILicenseTag } from '../definitions/ILicenseTag';

const EnterpriseLicenses = new EventEmitter();

export interface IValidLicense {
	valid?: boolean;
	license: ILicense;
}

let maxGuestUsers = 0;
let maxActiveUsers = 0;

class LicenseClass {
	private url: string | null = null;

	private licenses: IValidLicense[] = [];

	private encryptedLicenses = new Set<string>();

	private tags = new Set<ILicenseTag>();

	private modules = new Set<string>();

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
					item.valid = false;
					console.error(`#### License error: invalid url, licensed to ${license.url}, used on ${this.url}`);
					this._invalidModules(license.modules);
					return item;
				}
			}

			if (license.expiry && this._validateExpiration(license.expiry)) {
				item.valid = false;
				console.error(`#### License error: expired, valid until ${license.expiry}`);
				this._invalidModules(license.modules);
				return item;
			}

			if (license.maxGuestUsers > maxGuestUsers) {
				maxGuestUsers = license.maxGuestUsers;
			}

			if (license.maxActiveUsers > maxActiveUsers) {
				maxActiveUsers = license.maxActiveUsers;
			}

			this._validModules(license.modules);

			this._addTags(license);

			console.log('#### License validated:', license.modules.join(', '));

			item.valid = true;
			return item;
		});

		EnterpriseLicenses.emit('validate');
		this.showLicenses();
	}

	canAddNewUser(): boolean {
		if (!maxActiveUsers) {
			return true;
		}

		return maxActiveUsers > Users.getActiveLocalUserCount();
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

export function canAddNewUser(): boolean {
	return License.canAddNewUser();
}

export function onLicense(feature: BundleFeature, cb: (...args: any[]) => void): void {
	if (hasLicense(feature)) {
		return cb();
	}

	EnterpriseLicenses.once(`valid:${feature}`, cb);
}

export function onValidFeature(feature: BundleFeature, cb: () => void): () => void {
	EnterpriseLicenses.on(`valid:${feature}`, cb);

	if (hasLicense(feature)) {
		cb();
	}

	return (): void => {
		EnterpriseLicenses.off(`valid:${feature}`, cb);
	};
}

export function onInvalidFeature(feature: BundleFeature, cb: () => void): () => void {
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
		up?: () => void;
		down?: () => void;
	},
): () => void {
	let enabled = hasLicense(feature);

	const offValidFeature = onValidFeature(feature, () => {
		if (!enabled) {
			up?.();
			enabled = true;
		}
	});

	const offInvalidFeature = onInvalidFeature(feature, () => {
		if (enabled) {
			down?.();
			enabled = false;
		}
	});

	if (enabled) {
		up?.();
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

export function flatModules(modulesAndBundles: string[]): string[] {
	const bundles = modulesAndBundles.filter(isBundle);
	const modules = modulesAndBundles.filter((x) => !isBundle(x));

	const modulesFromBundles = bundles.map(getBundleModules).flat();

	return modules.concat(modulesFromBundles);
}

export interface IOverrideClassProperties {
	[key: string]: (...args: any[]) => any;
}

type Class = { new (...args: any[]): any };

export function overwriteClassOnLicense(license: BundleFeature, original: Class, overwrite: IOverrideClassProperties): void {
	onLicense(license, () => {
		Object.entries(overwrite).forEach(([key, value]) => {
			const originalFn = original.prototype[key];
			original.prototype[key] = function (...args: any[]): any {
				return value.call(this, originalFn, ...args);
			};
		});
	});
}
