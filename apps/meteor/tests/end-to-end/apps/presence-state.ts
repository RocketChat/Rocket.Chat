import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { appPresenceStateTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';
import { adminUsername } from '../../data/user';
import { getUserByUsername } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - Presence State Bridge', () => {
	let app: App;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		app = await installLocalTestPackage(appPresenceStateTest);
	});

	after(() => cleanupApps());

	describe('[setActiveState]', () => {
		it('should set the user presence with status text and source', async () => {
			const user = await getUserByUsername(adminUsername);

			await request
				.post(apps(`/public/${app.id}/set-active-state`))
				.set(credentials)
				.send({
					userId: user._id,
					statusDefault: 'busy',
					statusText: 'In a meeting',
					statusSource: 'internal',
				})
				.expect(200);

			const updatedUser = await getUserByUsername(adminUsername);
			expect(updatedUser.statusText).to.equal('In a meeting');
			expect(updatedUser.statusSource).to.equal('internal');
		});
	});

	describe('[endActiveState]', () => {
		it('should restore the user presence to previous state', async () => {
			const user = await getUserByUsername(adminUsername);

			// First set an active state
			await request
				.post(apps(`/public/${app.id}/set-active-state`))
				.set(credentials)
				.send({
					userId: user._id,
					statusDefault: 'busy',
					statusText: 'On a call',
					statusSource: 'internal',
				})
				.expect(200);

			// Then end it
			await request
				.post(apps(`/public/${app.id}/end-active-state`))
				.set(credentials)
				.send({ userId: user._id })
				.expect(200);

			const updatedUser = await getUserByUsername(adminUsername);
			expect(updatedUser.statusText).to.not.equal('On a call');
			expect(updatedUser.statusSource).to.not.equal('internal');
		});
	});
});
