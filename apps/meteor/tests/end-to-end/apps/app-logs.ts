import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { apps } from '../../data/apps/apps-data';
import { installTestApp, cleanupApps } from '../../data/apps/helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - Logs', () => {
	let app: App;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		app = await installTestApp();
	});

	after(() => cleanupApps());

	it('should throw an error when trying to get logs for an invalid app', (done) => {
		void request
			.get(apps('/invalid-id/logs'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(404)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.not.have.a.property('logs');
				expect(res.body.error).to.be.equal('No App found by the id of: invalid-id');
			})
			.end(done);
	});

	it('should return app logs successfully', (done) => {
		void request
			.get(apps(`/${app.id}/logs`))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body).to.have.a.property('logs').that.is.an('array').with.a.lengthOf.at.least(1).and.at.most(50);
				expect(res.body).to.have.a.property('count').that.is.a('number');
				expect(res.body).to.have.a.property('total').that.is.a('number');
				expect(res.body).to.have.a.property('offset').that.is.a('number');
			})
			.end(done);
	});

	it('should return app logs with pagination', (done) => {
		void request
			.get(apps(`/${app.id}/logs`))
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

	it('should return app logs with sorting', (done) => {
		void request
			.get(apps(`/${app.id}/logs`))
			.query({ sort: JSON.stringify({ _updatedAt: -1 }) })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf.at.least(1).and.at.most(50);
			})
			.end(done);
	});

	it('should return app logs filtered by logLevel', (done) => {
		void request
			.get(apps(`/${app.id}/logs`))
			.query({ logLevel: '2' })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf.at.least(1).and.at.most(50);

				res.body.logs.forEach((log: ILoggerStorageEntry) => {
					const entry = log.entries.find((entry) => ['error', 'warn', 'info', 'log', 'debug', 'success'].includes(entry.severity));

					expect(entry).to.exist;
				});
			})
			.end(done);
	});

	it('should return app logs filtered by method', (done) => {
		void request
			.get(apps(`/${app.id}/logs`))
			.query({ method: 'app:construct' })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf.at.least(1).and.at.most(50);

				res.body.logs.forEach((log: ILoggerStorageEntry) => {
					expect(log.method).to.equal('app:construct');
				});
			})
			.end(done);
	});

	it('should return app logs filtered by date range', (done) => {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 1); // 1 day ago
		const endDate = new Date();

		void request
			.get(apps(`/${app.id}/logs`))
			.query({
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			})
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf.at.least(1).and.at.most(50);

				// Verify that all returned logs are within the date range
				res.body.logs.forEach((log: ILoggerStorageEntry) => {
					const logDate = new Date(log._createdAt);

					expect(logDate).to.be.above(startDate).and.below(endDate);
				});
			})
			.end(done);
	});

	it('should return app logs with combined filters', (done) => {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 1); // 1 day ago
		const endDate = new Date();

		void request
			.get(apps(`/${app.id}/logs`))
			.query({
				logLevel: '2',
				method: 'app:construct',
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			})
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
				expect(res.body.logs).to.be.an('array').with.a.lengthOf.at.least(1).and.at.most(50);

				// Verify that all returned logs match all filter criteria
				res.body.logs.forEach((log: ILoggerStorageEntry) => {
					expect(log.method).to.equal('app:construct');

					const logDate = new Date(log._createdAt);
					expect(logDate >= startDate && logDate <= endDate).to.be.true;

					const entry = log.entries.find((entry) => ['error', 'warn', 'info', 'log', 'debug', 'success'].includes(entry.severity));

					expect(entry).to.exist;
				});
			})
			.end(done);
	});

	it('should reject invalid logLevel value', (done) => {
		void request
			.get(apps(`/${app.id}/logs`))
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

	it('should reject invalid date format', (done) => {
		void request
			.get(apps(`/${app.id}/logs`))
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

	it('should reject invalid date range', (done) => {
		const startDate = new Date();
		const endDate = new Date();
		endDate.setDate(endDate.getDate() - 1); // endDate before startDate

		void request
			.get(apps(`/${app.id}/logs`))
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

	it('should reject invalid additional properties', (done) => {
		void request
			.get(apps(`/${app.id}/logs`))
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

	it('should reject appId query parameter', (done) => {
		void request
			.get(apps(`/${app.id}/logs`))
			.query({ appId: 'invalid-id' })
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(404)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error', 'Invalid query parameter "appId": invalid-id');
			})
			.end(done);
	});
});
