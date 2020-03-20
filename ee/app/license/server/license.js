import EventEmiter from 'events';

import { Users } from '../../../../app/models/server';
import decrypt from './decrypt';
import { getBundleModules, isBundle } from './bundles';

const EnterpriseLicenses = new EventEmiter();

const License = {
	url: null,
	licenses: [],
	modules: {},

	_validateExpiration(expiration) {
		return new Date() > new Date(expiration);
	},

	_validateURL(licenseURL, url) {
		licenseURL = licenseURL
			.replace(/\./g, '\\.') // convert dots to literal
			.replace(/\*/g, '.*'); // convert * to .*
		const regex = new RegExp(`^${ licenseURL }$`, 'i');

		return regex.exec(url);
	},

	_validModules(licenseModules) {
		licenseModules.forEach((licenseModule) => {
			const modules = isBundle(licenseModule)
				? getBundleModules(licenseModule)
				: [licenseModule];

			modules.forEach((module) => {
				this.modules[module] = 1;
				EnterpriseLicenses.emit(`valid:${ module }`);
			});
		});
	},

	_invalidModules(licenseModules) {
		licenseModules.forEach((licenseModule) => {
			const modules = isBundle(licenseModule)
				? getBundleModules(licenseModule)
				: [licenseModule];

			modules.forEach((module) => EnterpriseLicenses.emit(`invalid:${ module }`));
		});
	},

	_hasValidNumberOfActiveUsers(maxActiveUsers) {
		return Users.getActiveLocalUserCount() <= maxActiveUsers;
	},

	addLicense(license) {
		this.licenses.push({
			valid: null,
			license,
		});

		this.validate();
	},

	hasModule(module) {
		return typeof this.modules[module] !== 'undefined';
	},

	setURL(url) {
		this.url = url.replace(/\/$/, '').replace(/^https?:\/\/(.*)$/, '$1');

		this.validate();
	},

	validate() {
		this.licenses = this.licenses.map((item) => {
			const { license } = item;

			if (license.url) {
				if (!this.url) {
					return item;
				}
				if (!this._validateURL(license.url, this.url)) {
					license.valid = false;
					this._invalidModules(license.modules);
					return item;
				}
			}

			if (license.expiry && this._validateExpiration(license.expiry)) {
				license.valid = false;
				this._invalidModules(license.modules);
				return item;
			}

			if (license.maxActiveUsers && !this._hasValidNumberOfActiveUsers(parseInt(license.maxActiveUsers))) {
				license.valid = false;
				this._invalidModules(license.modules);
				return item;
			}

			this._validModules(license.modules);

			console.log('#### License validated:', license.modules.join(', '));

			item.valid = true;
			return item;
		});

		this.showLicenses();
	},

	showLicenses() {
		if (!process.env.LICENSE_DEBUG || process.env.LICENSE_DEBUG === 'false') {
			return;
		}

		this.licenses
			.filter((item) => item.valid)
			.forEach((item) => {
				const { license } = item;

				console.log('---- License enabled ----');
				console.log('            url ->', license.url);
				console.log('         expiry ->', license.expiry);
				console.log(' maxActiveUsers ->', license.maxActiveUsers);
				console.log('        modules ->', license.modules.join(', '));
				console.log('-------------------------');
			});
	},
};

export function addLicense(encryptedLicense) {
	if (!encryptedLicense || String(encryptedLicense).trim() === '') {
		return;
	}

	console.log('### New Enteprise License');

	try {
		const decrypted = decrypt(encryptedLicense);
		if (!decrypted) {
			return;
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
	}
}

export function setURL(url) {
	License.setURL(url);
}

export function hasLicense(feature) {
	return License.hasModule(feature);
}

export function onLicense(feature, cb) {
	if (hasLicense(feature)) {
		return cb();
	}

	EnterpriseLicenses.once(`valid:${ feature }`, cb);
}
