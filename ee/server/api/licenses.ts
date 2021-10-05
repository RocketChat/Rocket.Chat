import { check } from 'meteor/check';

import { ILicense, getLicenses, validateFormat, flatModules } from '../../app/license/server/license';
import { Settings } from '../../../app/models/server';
import { API } from '../../../app/api/server/api';
import { hasPermission } from '../../../app/authorization/server';

function licenseTransform(license: ILicense): ILicense {
	return {
		...license,
		modules: flatModules(license.modules),
	};
}

API.v1.addRoute('licenses.get', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-privileged-setting')) {
			return API.v1.unauthorized();
		}

		const licenses = getLicenses()
			.filter(({ valid }) => valid)
			.map(({ license }) => licenseTransform(license));

		return API.v1.success({ licenses });
	},
});

API.v1.addRoute('licenses.add', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			license: String,
		});

		if (!hasPermission(this.userId, 'edit-privileged-setting')) {
			return API.v1.unauthorized();
		}

		const { license } = this.bodyParams;
		if (!validateFormat(license)) {
			return API.v1.failure('Invalid license');
		}

		Settings.updateValueById('Enterprise_License', license);

		return API.v1.success();
	},
});
