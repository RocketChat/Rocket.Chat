import { check } from 'meteor/check';

import { ILicense, getLicenses, validateFormat, flatModules } from '../../app/license/server/license';
import { Settings, Users } from '../../../app/models/server';
import { API } from '../../../app/api/server/api';
import { hasPermission } from '../../../app/authorization/server';
import { getSeatsRequestLink } from '../../app/license/server/getSeatsRequestLink';
import { Analytics } from '../../../server/sdk';

function licenseTransform(license: ILicense): ILicense {
	return {
		...license,
		modules: flatModules(license.modules),
	};
}

API.v1.addRoute('licenses.requestSeatsLink', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-privileged-setting')) {
			return API.v1.unauthorized();
		}

		const url = getSeatsRequestLink();

		return API.v1.success({ url });
	},
});

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

API.v1.addRoute('licenses.maxActiveUsers', { authRequired: true }, {
	get() {
		const maxActiveUsers = getLicenses()
			.filter(({ valid }) => valid)
			.map(({ license }) => license.maxActiveUsers)
			.shift() ?? null;

		const activeUsers = Users.getActiveLocalUserCount();

		return API.v1.success({ maxActiveUsers, activeUsers });
	},
});
