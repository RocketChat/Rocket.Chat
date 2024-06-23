import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { apps } from '../../data/apps/apps-data';
import { installTestApp, cleanupApps } from '../../data/apps/helper';

describe('Apps - Uninstall', () => {
	let app: App;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		app = await installTestApp();
	});

	after(() => cleanupApps());

	describe('[Uninstall]', () => {
		it('should throw an error when trying to uninstall an invalid app', (done) => {
			void request
				.delete(apps('/invalid-id'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(404)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
					expect(res.body.error).to.be.equal('No App found by the id of: invalid-id');
				})
				.end(done);
		});
		it('should remove the app successfully', (done) => {
			void request
				.delete(apps(`/${app.id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('app');
					expect(res.body.app.id).to.be.equal(app.id);
					expect(res.body.app.status).to.be.equal('disabled');
				})
				.end(done);
		});
	});
});
