import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { apps } from '../../data/apps/apps-data';
import { installTestApp, cleanupApps } from '../../data/apps/helper';
import { updatePermission } from '../../data/permissions.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - Logs Distinct Values', () => {
	let appId: string;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		const app = await installTestApp();
		appId = app.id;
	});

	after(() => Promise.all([cleanupApps(), updatePermission('manage-apps', ['admin'])]));

	it('should return distinct values successfully', (done) => {
		void request
			.get(apps(`/${appId}/logs/distinctValues`))
			.set(credentials)
			.expect(200)
			.expect('Content-Type', 'application/json')
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body).to.have.a.property('instanceIds').that.is.an('array');
				expect(res.body).to.have.a.property('methods').that.is.an('array');

				const { instanceIds, methods } = res.body;
				const uniqueInstanceIds = new Set(instanceIds);
				const uniqueMethods = new Set(methods);

				// All instance IDs should be unique
				expect(instanceIds).to.have.lengthOf(uniqueInstanceIds.size);

				// All methods should be unique
				expect(methods).to.have.lengthOf(uniqueMethods.size);
			})
			.end(done);
	});

	it('should require authentication', (done) => {
		void request
			.get(apps(`/${appId}/logs/distinctValues`))
			.expect(401)
			.expect('Content-Type', 'application/json')
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error');
			})
			.end(done);
	});

	it('should require manage-apps permission', (done) => {
		void updatePermission('manage-apps', []).then(
			() =>
				void request
					.get(apps(`/${appId}/logs/distinctValues`))
					.set(credentials)
					.expect(403)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
					})
					// Doing the `updatePermission` call here pollutes the error reporting, but we shouldn't call `done` before doing it.
					.end((err) => void updatePermission('manage-apps', ['admin']).then(() => void done(err))),
		);
	});

	it('should return 404 for non-existent app', (done) => {
		void request
			.get(apps('/non-existent-app-id/logs/distinctValues'))
			.set(credentials)
			.expect(404)
			.expect('Content-Type', 'application/json')
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error');
			})
			.end(done);
	});

	it('should return empty arrays when no logs exist', (done) => {
		// Clean up all apps first to ensure no logs
		void cleanupApps().then(async () => {
			// Install a fresh app
			const app = await installTestApp();
			void request
				.get(apps(`/${app.id}/logs/distinctValues`))
				.set(credentials)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('instanceIds').that.is.an('array');
					expect(res.body).to.have.a.property('methods').that.is.an('array');
					// Could be empty or have values from other tests
					expect(res.body.instanceIds).to.satisfy((arr: any[]) => Array.isArray(arr));
					expect(res.body.methods).to.satisfy((arr: any[]) => Array.isArray(arr));
				})
				.end(done);
		});
	});
});
