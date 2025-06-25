import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { apps } from '../../data/apps/apps-data';
import { installTestApp, cleanupApps } from '../../data/apps/helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - Logs Export', () => {
	let app: App;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		app = await installTestApp();
	});

	after(() => cleanupApps());

	it('should throw an error when trying to export logs for an invalid app', (done) => {
		void request
			.get(apps('/invalid-id/export-logs'))
			.query({ type: 'json' })
			.set(credentials)
			.expect(404)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body.error).to.be.equal('No App found by the id of: invalid-id');
			})
			.end(done);
	});

	it('should export app logs as JSON successfully', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ type: 'json' })
			.set(credentials)
			.expect('Content-Type', 'text/plain')
			.expect(200)
			.expect((res) => {
				expect(res.headers).to.have.a.property('content-disposition');
				expect(res.headers['content-disposition']).to.include('attachment');
				expect(res.headers['content-disposition']).to.include(`app-logs-${app.id}`);
				expect(res.headers['content-disposition']).to.include('.json');
				expect(res.headers).to.have.a.property('content-length');

				// Verify the content is valid JSON
				expect(() => JSON.parse(res.text)).to.not.throw();
				const logs = JSON.parse(res.text);
				expect(logs).to.be.an('array');
				expect(logs[0]).to.have.a.property('_id');
				expect(logs[0]).to.have.a.property('appId', app.id);
			})
			.end(done);
	});

	it('should export app logs as CSV successfully', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ type: 'csv' })
			.set(credentials)
			.expect('Content-Type', 'text/plain')
			.expect(200)
			.expect((res) => {
				expect(res.headers).to.have.a.property('content-disposition');
				expect(res.headers['content-disposition']).to.include('attachment');
				expect(res.headers['content-disposition']).to.include(`app-logs-${app.id}`);
				expect(res.headers['content-disposition']).to.include('.csv');
				expect(res.headers).to.have.a.property('content-length');

				// Verify the content is valid CSV (should have headers and at least one row)
				const lines = res.text.split('\n');
				expect(lines.length).to.be.at.least(1); // At least header row
				if (lines.length > 1 && lines[0]) {
					// Check that headers contain expected fields
					expect(lines[0]).to.include('_id');
					expect(lines[0]).to.include('appId');
				}
			})
			.end(done);
	});

	it('should throw error when type is not specified', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.set(credentials)
			.expect(400)
			.end(done);
	});

	it('should export app logs with pagination parameters', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ count: 5, type: 'json' })
			.set(credentials)
			.expect('Content-Type', 'text/plain')
			.expect(200)
			.expect((res) => {
				const logs = JSON.parse(res.text);
				expect(logs).to.be.an('array');
				expect(logs.length).to.be.at.most(5);
			})
			.end(done);
	});

	it('should export app logs with sorting parameters', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({
				sort: JSON.stringify({ _updatedAt: 1 }),
				type: 'json',
			})
			.set(credentials)
			.expect('Content-Type', 'text/plain')
			.expect(200)
			.expect((res) => {
				const logs = JSON.parse(res.text);
				expect(logs).to.be.an('array');
				// Verify sorting by checking if timestamps are in ascending order
				if (logs.length > 1) {
					for (let i = 1; i < logs.length; i++) {
						const prevTime = new Date(logs[i - 1]._updatedAt).getTime();
						const currTime = new Date(logs[i]._updatedAt).getTime();
						expect(currTime).to.be.at.least(prevTime);
					}
				}
			})
			.end(done);
	});

	it('should export app logs filtered by logLevel', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ logLevel: '2', type: 'json' })
			.set(credentials)
			.expect('Content-Type', 'text/plain')
			.expect(200)
			.expect((res) => {
				const logs = JSON.parse(res.text);
				expect(logs).to.be.an('array');

				logs.forEach((log: ILoggerStorageEntry) => {
					const entry = log.entries.find((entry) => ['error', 'warn', 'info', 'log', 'debug', 'success'].includes(entry.severity));
					expect(entry).to.exist;
				});
			})
			.end(done);
	});

	it('should export app logs filtered by method', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ method: 'app:construct', type: 'json' })
			.set(credentials)
			.expect('Content-Type', 'text/plain')
			.expect(200)
			.expect((res) => {
				const logs = JSON.parse(res.text);
				expect(logs).to.be.an('array');

				logs.forEach((log: ILoggerStorageEntry) => {
					expect(log.method).to.equal('app:construct');
				});
			})
			.end(done);
	});

	it('should export app logs filtered by date range', (done) => {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 1); // 1 day ago
		const endDate = new Date();

		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				type: 'json',
			})
			.set(credentials)
			.expect('Content-Type', 'text/plain')
			.expect(200)
			.expect((res) => {
				const logs = JSON.parse(res.text);
				expect(logs).to.be.an('array');

				// Verify that all returned logs are within the date range
				logs.forEach((log: ILoggerStorageEntry) => {
					const logDate = new Date(log._createdAt);
					expect(logDate).to.be.above(startDate).and.below(endDate);
				});
			})
			.end(done);
	});

	it('should export app logs with combined filters', (done) => {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 1); // 1 day ago
		const endDate = new Date();

		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({
				logLevel: '2',
				method: 'app:construct',
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				type: 'json',
				count: 10,
			})
			.set(credentials)
			.expect('Content-Type', 'text/plain')
			.expect(200)
			.expect((res) => {
				const logs = JSON.parse(res.text);
				expect(logs).to.be.an('array');
				expect(logs.length).to.be.at.most(10);

				// Verify that all returned logs match all filter criteria
				logs.forEach((log: ILoggerStorageEntry) => {
					expect(log.method).to.equal('app:construct');

					const logDate = new Date(log._createdAt);
					expect(logDate >= startDate && logDate <= endDate).to.be.true;

					const entry = log.entries.find((entry) => ['error', 'warn', 'info', 'log', 'debug', 'success'].includes(entry.severity));
					expect(entry).to.exist;
				});
			})
			.end(done);
	});

	it('should return an error when no logs are found for the specified criteria', (done) => {
		const futureDate = new Date();
		futureDate.setFullYear(futureDate.getFullYear() + 1);

		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({
				startDate: futureDate.toISOString(),
				type: 'json',
			})
			.set(credentials)
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body.error).to.be.equal('No logs found for the specified criteria');
			})
			.end(done);
	});

	it('should respect the maximum limit of 2000 logs', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ count: 5000, type: 'json' })
			.set(credentials)
			.expect('Content-Type', 'text/plain')
			.expect(200)
			.expect((res) => {
				const logs = JSON.parse(res.text);
				expect(logs).to.be.an('array');
				expect(logs.length).to.be.at.most(2000);
			})
			.end(done);
	});

	it('should reject invalid logLevel value', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ logLevel: 'debug' })
			.set(credentials)
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error').that.is.not.empty;
			})
			.end(done);
	});

	it('should reject invalid date format', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ startDate: 'invalid-date' })
			.set(credentials)
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
			.get(apps(`/${app.id}/export-logs`))
			.query({
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			})
			.set(credentials)
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error').that.is.not.empty;
			})
			.end(done);
	});

	it('should reject invalid additional properties', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ invalidProperty: 'value' })
			.set(credentials)
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', false);
				expect(res.body).to.have.a.property('error').that.is.not.empty;
			})
			.end(done);
	});

	it('should handle authentication requirement', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ type: 'json' })
			.expect(401)
			.end(done);
	});

	it('should handle authentication via cookie', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ type: 'json' })
			.set({ cookie: `rc_uid=${credentials['X-User-Id']}; rc_token=${credentials['X-Auth-Token']}` })
			.expect(200)
			.end(done);
	});

	it('should include proper filename with timestamp in Content-Disposition header', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ type: 'json' })
			.set(credentials)
			.expect(200)
			.expect((res) => {
				const contentDisposition = res.headers['content-disposition'];
				expect(contentDisposition).to.include('attachment');
				expect(contentDisposition).to.include(`app-logs-${app.id}`);
				expect(contentDisposition).to.include('.json');

				// Check that timestamp is included (format: YYYY-MM-DDTHH-MM-SS)
				const timestampRegex = /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/;
				expect(contentDisposition).to.match(timestampRegex);
			})
			.end(done);
	});

	it('should include Content-Length header', (done) => {
		void request
			.get(apps(`/${app.id}/export-logs`))
			.query({ type: 'json' })
			.set(credentials)
			.expect(200)
			.expect((res) => {
				expect(res.headers).to.have.a.property('content-length');
				const contentLength = parseInt(res.headers['content-length'], 10);
				expect(contentLength).to.be.a('number');
				expect(contentLength).to.be.greaterThan(0);
				expect(contentLength).to.equal(Buffer.byteLength(res.text, 'utf8'));
			})
			.end(done);
	});
});
