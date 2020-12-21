import { check } from 'meteor/check';

import * as api from '../api';
import { addLicense, getLicenses } from '../../../../ee/app/license/server/license';
import { Settings } from '../../../models/server';

interface IAPIRouter {
	v1: api.APIClass;
}

const API = api.API as IAPIRouter;

API.v1.addRoute('licenses.post', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			license: String,
		});

		const { license } = this.bodyParams;
		if (!addLicense(license)) {
			return API.v1.failure({ error: 'Invalid license' }, null, null, null);
		}

		Settings.updateValueById('Enterprise_License', license);

		return API.v1.success();
	},
});

API.v1.addRoute('licenses.get', { authRequired: true }, {
	get() {
		const licenses = getLicenses().map((x) => x.license);

		if (!licenses || licenses.length === 0) {
			return API.v1.failure('Could not find registered licenses', null, null, null);
		}

		return API.v1.success({ licenses });
	},
});
