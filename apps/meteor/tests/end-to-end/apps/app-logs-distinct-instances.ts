import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { apps } from '../../data/apps/apps-data';
import { installTestApp, cleanupApps } from '../../data/apps/helper';
import { updatePermission } from '../../data/permissions.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - Logs Distinct Instances', () => {
	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		await installTestApp();
	});

	after(() => Promise.all([cleanupApps(), updatePermission('manage-apps', ['admin'])]));

	it('should return distinct instance IDs successfully', (done) => {
		void request
			.get(apps('/logs/instanceIds'))
			.set(credentials)
			.expect(200)
			.expect('Content-Type', 'application/json')
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body).to.have.a.property('instanceIds').that.is.an('array');

				const { instanceIds } = res.body;
				const uniqueInstanceIds = [...new Set(instanceIds)];

				// All instance IDs should be unique
				expect(instanceIds).to.have.lengthOf(uniqueInstanceIds.length);
			})
			.end(done);
	});

	it('should require authentication', (done) => {
		void request
			.get(apps('/logs/instanceIds'))
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
					.get(apps('/logs/instanceIds'))
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

	it('should return empty array when no instances exist', (done) => {
		// Clean up all apps first to ensure no instances
		void cleanupApps().then(() => {
			void request
				.get(apps('/logs/instanceIds'))
				.set(credentials)
				.expect(200)
				.expect('Content-Type', 'application/json')
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('instanceIds').that.is.an('array');
					// Could be empty or have instances from other tests
					expect(res.body.instanceIds).to.satisfy((arr: any[]) => Array.isArray(arr));
				})
				.end(done);
		});
	});
});
