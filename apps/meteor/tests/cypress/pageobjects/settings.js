import supertest from 'supertest';

import { adminUsername, adminPassword } from '../../data/user.js';

const testUrl = (typeof Cypress !== 'undefined' && Cypress.env('TEST_API_URL')) || process.env.TEST_API_URL || 'http://localhost:3000';

const request = supertest(testUrl);
const prefix = '/api/v1/';

const login = {
	user: adminUsername,
	password: adminPassword,
};

function api(path) {
	return prefix + path;
}

export async function getSettingValue(name) {
	let credentials = {
		'X-Auth-Token': undefined,
		'X-User-Id': undefined,
	};

	// login
	const reponseLogin = await request.post(api('login')).send(login).expect('Content-Type', 'application/json').expect(200);

	credentials = {
		'X-Auth-Token': reponseLogin.body.data.authToken,
		'X-User-Id': reponseLogin.body.data.userId,
	};

	const responseGetSetting = await request
		.get(api(`settings/${name}`))
		.set(credentials)
		.expect('Content-Type', 'application/json')
		.expect(200);

	await request.post(api('logout')).set(credentials).expect('Content-Type', 'application/json').expect(200);

	return responseGetSetting.body.value;
}
