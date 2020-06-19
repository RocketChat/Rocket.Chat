import { EventEmitter } from 'events';

import { Users } from '../../../../app/models/server';
import { resetEnterprisePermissions } from '../../authorization/server/resetEnterprisePermissions';
import { addRoleRestrictions } from '../../authorization/lib/addRoleRestrictions';
import decrypt from './decrypt';
import { getBundleModules, isBundle } from './bundles';

const EnterpriseLicenses = new EventEmitter();

export interface ILicense {
	url: string;
	expiry: string;
	maxActiveUsers: number;
	modules: string[];
	maxGuestUsers: number;
	maxRoomsPerGuest: number;
}

export interface IValidLicense {
	valid?: boolean;
	license: ILicense;
}

let maxGuestUsers = 0;
let addedRoleRestrictions = false;

class LicenseClass {
	private url: string|null = null;

	private licenses: IValidLicense[] = [];

	private modules = new Set<string>();

	_validateExpiration(expiration: string): boolean {
		return new Date() > new Date(expiration);
	}

	_validateURL(licenseURL: string, url: string): boolean {
		licenseURL = licenseURL
			.replace(/\./g, '\\.') // convert dots to literal
			.replace(/\*/g, '.*'); // convert * to .*
		const regex = new RegExp(`^${ licenseURL }$`, 'i');

		return !!regex.exec(url);
	}

	_validModules(licenseModules: string[]): void {
		licenseModules.forEach((licenseModule) => {
			const modules = isBundle(licenseModule)
				? getBundleModules(licenseModule)
				: [licenseModule];

			modules.forEach((module) => {
				this.modules.add(module);
				EnterpriseLicenses.emit(`valid:${ module }`);
			});
		});
	}

	_invalidModules(licenseModules: string[]): void {
		licenseModules.forEach((licenseModule) => {
			const modules = isBundle(licenseModule)
				? getBundleModules(licenseModule)
				: [licenseModule];

			modules.forEach((module) => EnterpriseLicenses.emit(`invalid:${ module }`));
		});
	}

	_hasValidNumberOfActiveUsers(maxActiveUsers: number): boolean {
		return Users.getActiveLocalUserCount() <= maxActiveUsers;
	}

	addLicense(license: ILicense): void {
		this.licenses.push({
			valid: undefined,
			license,
		});

		this.validate();

		if (!addedRoleRestrictions && this.hasAnyValidLicense()) {
			addRoleRestrictions();
			resetEnterprisePermissions();
			addedRoleRestrictions = true;
		}
	}

	hasModule(module: string): boolean {
		return this.modules.has(module);
	}

	hasAnyValidLicense(): boolean {
		return this.licenses.some((item) => item.valid);
	}

	getModules(): string[] {
		return [...this.modules];
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
					this._invalidModules(license.modules);
					return item;
				}
			}

			if (license.expiry && this._validateExpiration(license.expiry)) {
				item.valid = false;
				this._invalidModules(license.modules);
				return item;
			}

			if (license.maxActiveUsers && !this._hasValidNumberOfActiveUsers(license.maxActiveUsers)) {
				item.valid = false;
				this._invalidModules(license.modules);
				return item;
			}

			if (license.maxGuestUsers > maxGuestUsers) {
				maxGuestUsers = license.maxGuestUsers;
			}

			this._validModules(license.modules);

			console.log('#### License validated:', license.modules.join(', '));

			item.valid = true;
			return item;
		});

		this.showLicenses();
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
	if (!encryptedLicense || String(encryptedLicense).trim() === '') {
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

		return true;
	} catch (e) {
		console.error('##### Invalid license');
		if (process.env.LICENSE_DEBUG && process.env.LICENSE_DEBUG !== 'false') {
			console.error('##### Invalid raw license ->', encryptedLicense, e);
		}
		return false;
	}
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

export function getModules(): string[] {
	return License.getModules();
}

export function onLicense(feature: string, cb: (...args: any[]) => void): void {
	if (hasLicense(feature)) {
		return cb();
	}

	EnterpriseLicenses.once(`valid:${ feature }`, cb);
}

export interface IOverrideClassProperties {
	[key: string]: (...args: any[]) => any;
}

type Class = { new(...args: any[]): any };

export function overwriteClassOnLicense(license: string, original: Class, overwrite: IOverrideClassProperties): void {
	onLicense(license, () => {
		Object.entries(overwrite).forEach(([key, value]) => {
			const originalFn = original.prototype[key];
			original.prototype[key] = function(...args: any[]): any {
				return value.call(this, originalFn, ...args);
			};
		});
	});
}
