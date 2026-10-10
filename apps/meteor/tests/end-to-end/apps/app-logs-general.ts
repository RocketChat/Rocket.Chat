import { after, before, describe, it } from 'node:test';

import type { ILoggerStorageEntry } from '@rocket.chat/apps/dist/server/logging/ILoggerStorageEntry';
import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, request, credentials } from '../../data/api-data';
import { apps } from '../../data/apps/apps-data';
import { installTestApp, cleanupApps } from '../../data/apps/helper';
import { updatePermission } from '../../data/permissions.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - General Logs (GET /api/apps/logs)', () => {
	let app: App;

	before((_t, done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		app = await installTestApp();
	});

	after(() => Promise.all([cleanupApps(), updatePermission('manage-apps', ['admin'])]));

	it('should return logs for all apps successfully', (_t, done) => {
		void request
			.get(apps('/logs'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body).to.have.a.property('logs').that.is.an('array').with.a.lengthOf.at.least(1);
				expect(res.body).to.have.a.property('count').that.is.a('number');
				expect(res.body).to.have.a.property('total').that.is.a('number');
				expect(res.body).to.have.a.property('offset').that.is.a('number');
			})
			.end(done);
	});

	it('should require authentication', (_t, done) => {
		void request
			.get(apps('/logs'))
			.expect('Content-Type', 'application/json')
			.expect(401)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error');
			})
			.end(done);
	});

	it('should require manage-apps permission', (_t, done) => {
		void updatePermission('manage-apps', []).then(
			() =>
				void request
					.get(apps('/logs'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
					})
					.end((err) => void updatePermission('manage-apps', ['admin']).then(() => void done(err))),
		);
	});

	it('should return logs with pagination', (_t, done) => {
		void request
			.get(apps('/logs'))
			.query({ count: 1, offset: 0 })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf(1);
				expect(res.body.count).to.be.equal(1);
				expect(res.body.offset).to.be.equal(0);
			})
			.end(done);
	});

	it('should return logs with sorting', (_t, done) => {
		void request
			.get(apps('/logs'))
			.query({ sort: JSON.stringify({ _updatedAt: -1 }) })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf.at.least(1);
			})
			.end(done);
	});

	it('should return logs filtered by appId', (_t, done) => {
		void request
			.get(apps('/logs'))
			.query({ appId: app.id })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf.at.least(1);

				res.body.logs.forEach((log: ILoggerStorageEntry) => {
					expect(log.appId).to.equal(app.id);
				});
			})
			.end(done);
	});

	it('should return logs filtered by method', (_t, done) => {
		void request
			.get(apps('/logs'))
			.query({ method: 'app:construct' })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf.at.least(1);

				res.body.logs.forEach((log: ILoggerStorageEntry) => {
					expect(log.method).to.equal('app:construct');
				});
			})
			.end(done);
	});

	it('should return logs filtered by logLevel', (_t, done) => {
		void request
			.get(apps('/logs'))
			.query({ logLevel: '2' })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf.at.least(1);

				res.body.logs.forEach((log: ILoggerStorageEntry) => {
					const entry = log.entries.find((entry) => ['error', 'warn', 'info', 'log', 'debug', 'success'].includes(entry.severity));
					expect(entry).to.exist;
				});
			})
			.end(done);
	});

	it('should return logs filtered by date range', (_t, done) => {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 1); // 1 day ago
		const endDate = new Date();

		void request
			.get(apps('/logs'))
			.query({
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			})
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf.at.least(1);

				res.body.logs.forEach((log: ILoggerStorageEntry) => {
					const logDate = new Date(log._createdAt);
					expect(logDate).to.be.above(startDate).and.below(endDate);
				});
			})
			.end(done);
	});

	it('should reject invalid logLevel value', (_t, done) => {
		void request
			.get(apps('/logs'))
			.query({ logLevel: 'debug' })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error').that.is.not.empty;
			})
			.end(done);
	});

	it('should reject invalid date format', (_t, done) => {
		void request
			.get(apps('/logs'))
			.query({ startDate: 'invalid-date' })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error').that.is.not.empty;
			})
			.end(done);
	});

	it('should reject invalid date range', (_t, done) => {
		const startDate = new Date();
		const endDate = new Date();
		endDate.setDate(endDate.getDate() - 1); // endDate before startDate

		void request
			.get(apps('/logs'))
			.query({
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			})
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error').that.is.not.empty;
			})
			.end(done);
	});

	it('should reject invalid additional properties', (_t, done) => {
		void request
			.get(apps('/logs'))
			.query({ invalidProperty: 'value' })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error').that.is.not.empty;
			})
			.end(done);
	});
});
