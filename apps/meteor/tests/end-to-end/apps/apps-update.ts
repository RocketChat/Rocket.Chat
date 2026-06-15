import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { appUpdateTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';
import { getUserByUsername } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

const APP_USERNAME = 'app-update-test.bot';

(IS_EE ? describe : describe.skip)('Apps - Update', () => {
	let app: App;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		app = await installLocalTestPackage(appUpdateTest);
	});

	after(() => cleanupApps());

	describe('[App user presence]', () => {
		it('should keep the app user online after the app is updated', async () => {
			const appUserBefore = await getUserByUsername(APP_USERNAME);
			expect(appUserBefore.status).to.be.equal('online');

			await request
				.post(apps(`/${app.id}`))
				.set(credentials)
				.attach('app', appUpdateTest)
				.expect(200);

			const appUserAfter = await getUserByUsername(APP_USERNAME);
			expect(appUserAfter.status).to.be.equal('online');
		});
	});
});
