import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { appUpdateStatusTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';
import { getUserByUsername } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

const APP_USERNAME = 'update-status-test.bot';

(IS_EE ? describe : describe.skip)('Apps - Update App User Presence', () => {
	let app: App;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		app = await installLocalTestPackage(appUpdateStatusTest);
	});

	after(() => cleanupApps());

	it('should maintain app user status as online after app update', async () => {
		const appUserBefore = await getUserByUsername(APP_USERNAME);
		expect(appUserBefore.status).to.be.equal('online');

		await request
			.post(apps(`/${app.id}`))
			.set(credentials)
			.attach('app', appUpdateStatusTest)
			.expect(200);

		const appUserAfter = await getUserByUsername(APP_USERNAME);
		expect(appUserAfter.status).to.be.equal('online');
	});
});
