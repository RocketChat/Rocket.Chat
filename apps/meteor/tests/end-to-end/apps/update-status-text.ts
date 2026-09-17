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

(IS_EE ? describe : describe.skip)('Apps - Update App User Status', () => {
	let app: App;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		app = await installLocalTestPackage(appUpdateStatusTest);
	});

	after(() => cleanupApps());

	describe('[updateStatusText]', () => {
		it('should update the app user statusText', async () => {
			const statusText = `test-status-${Date.now()}`;

			await request
				.post(apps(`/public/${app.id}/update-status-text`))
				.set(credentials)
				.send({ username: APP_USERNAME, statusText })
				.expect(200);

			const appUser = await getUserByUsername(APP_USERNAME);
			expect(appUser.statusText).to.be.equal(statusText);
		});

		it('should clear the app user statusText', async () => {
			await request
				.post(apps(`/public/${app.id}/update-status-text`))
				.set(credentials)
				.send({ username: APP_USERNAME, statusText: '' })
				.expect(200);

			const appUser = await getUserByUsername(APP_USERNAME);
			expect(appUser.statusText).to.be.equal('');
		});
	});

	describe('[updateStatus]', () => {
		it('should update the app user statusText when status and statusText is provided', async () => {
			const statusText = `busy-status-${Date.now()}`;

			await request
				.post(apps(`/public/${app.id}/update-status`))
				.set(credentials)
				.send({ username: APP_USERNAME, status: 'busy', statusText })
				.expect(200);

			const appUser = await getUserByUsername(APP_USERNAME);

			// We can't test the status value because the Presence service will override it with OFFLINE
			// when the user doesn't have an active session/connection
			// expect(appUser.status).to.equal(status);
			expect(appUser.statusText).to.be.equal(statusText);
		});

		it('should clear statusText when status is updated without providing statusText', async () => {
			await request
				.post(apps(`/public/${app.id}/update-status`))
				.set(credentials)
				.send({ username: APP_USERNAME, status: 'away' })
				.expect(200);

			const appUser = await getUserByUsername(APP_USERNAME);

			// The test app defaults statusText to '' when not provided,
			// so the presence engine correctly clears it
			expect(appUser.statusText).to.be.equal('');
		});
	});
});
