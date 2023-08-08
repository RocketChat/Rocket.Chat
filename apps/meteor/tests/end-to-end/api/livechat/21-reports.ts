/* eslint-env mocha */

import { expect } from 'chai';

import { api, request, credentials, getCredentials } from '../../../data/api-data';
import { restorePermissionToRoles, updatePermission } from '../../../data/permissions.helper';

describe('LIVECHAT - reports', () => {
	before((done) => getCredentials(done));

	describe('livechat/analytics/dashboards/conversations-by-source', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(403);
		});
		it('should return an error when the start and end parameters are not provided', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request.get(api('livechat/analytics/dashboards/conversations-by-source')).set(credentials).expect(400);
		});
		it('should return an error when the start parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-source')).set(credentials).query({ end: 'test' }).expect(400);
		});
		it('should return an error when the end parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-source')).set(credentials).query({ start: 'test' }).expect(400);
		});
		it('should return an error when the start parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: '2020-01-01', end: 'test' })
				.expect(400);
		});
		it('should return the proper data when the parameters are valid', async () => {
			// Note: this way all data will come as 0
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: now, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('object');
			expect(body.data).to.have.property('open', 0);
			expect(body.data).to.have.property('closed', 0);
			expect(body.data).to.have.property('queued', 0);
			expect(body.success).to.be.true;
		});
		it('should return the proper data from a pipeline run :)', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-source'))
				.set(credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('object');
			expect(body.data).to.have.property('twilio').and.to.be.greaterThanOrEqual(1);
			expect(body.data).to.have.property('api').and.to.be.greaterThanOrEqual(1);
			expect(body.data).to.have.property('widget').and.to.be.greaterThanOrEqual(1);
			console.log(body.data);
		});
	});
	describe('livechat/analytics/dashboards/conversations-by-status', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(403);
		});
		it('should return an error when the start and end parameters are not provided', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request.get(api('livechat/analytics/dashboards/conversations-by-status')).set(credentials).expect(400);
		});
		it('should return an error when the start parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-status')).set(credentials).query({ end: 'test' }).expect(400);
		});
		it('should return an error when the end parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-status')).set(credentials).query({ start: 'test' }).expect(400);
		});
		it('should return an error when the start parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: '2020-01-01', end: 'test' })
				.expect(400);
		});
		it('should return the proper data when the parameters are valid', async () => {
			// Note: this way all data will come as 0
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: now, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('object');
			expect(Object.keys(body.data).length).to.be.equal(0);
			expect(body.success).to.be.true;
		});
		it('should return the proper data from a pipeline run :)', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-status'))
				.set(credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('object');
			expect(body.data).to.have.property('open').and.to.be.greaterThanOrEqual(1);
			expect(body.data).to.have.property('closed').and.to.be.greaterThanOrEqual(1);
			expect(body.data).to.have.property('queued').and.to.be.greaterThanOrEqual(1);
		});
	});
	describe('livechat/analytics/dashboards/conversations-by-department', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(403);
		});
		it('should return an error when the start and end parameters are not provided', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request.get(api('livechat/analytics/dashboards/conversations-by-department')).set(credentials).expect(400);
		});
		it('should return an error when the start parameter is not provided', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not provided', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: 'test' })
				.expect(400);
		});
		it('should return an error when the start parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: '2020-01-01', end: 'test' })
				.expect(400);
		});
		it('should return the proper data when the parameters are valid', async () => {
			// Note: this way all data will come as 0
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: now, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('object');
			expect(Object.keys(body.data).length).to.be.equal(0);
			expect(body.success).to.be.true;
		});
		it('should return the proper data from a pipeline run :)', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-department'))
				.set(credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('object');
			const data = Object.keys(body.data);
			expect(data).to.have.lengthOf.greaterThan(0);
			expect(data.every((key) => body.data[key] > 0)).to.be.true;
		});
	});
	describe('livechat/analytics/dashboards/conversations-by-tags', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(403);
		});
		it('should return an error when the start and end parameters are not provided', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request.get(api('livechat/analytics/dashboards/conversations-by-tags')).set(credentials).expect(400);
		});
		it('should return an error when the start parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-tags')).set(credentials).query({ end: 'test' }).expect(400);
		});
		it('should return an error when the end parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-tags')).set(credentials).query({ start: 'test' }).expect(400);
		});
		it('should return an error when the start parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: '2020-01-01', end: 'test' })
				.expect(400);
		});
		it('should return the proper data when the parameters are valid', async () => {
			// Note: this way all data will come as 0
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: now, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('object');
			expect(Object.keys(body.data).length).to.be.equal(0);
			expect(body.success).to.be.true;
		});
		it('should return the proper data from a pipeline run :)', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-tags'))
				.set(credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('object');
			const data = Object.keys(body.data);
			expect(data).to.have.lengthOf.greaterThan(0);
			expect(data.every((key) => body.data[key] > 0)).to.be.true;
		});
	});
	describe('livechat/analytics/dashboards/conversations-by-agent', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(403);
		});
		it('should return an error when the start and end parameters are not provided', async () => {
			await restorePermissionToRoles('view-livechat-manager');
			await request.get(api('livechat/analytics/dashboards/conversations-by-agent')).set(credentials).expect(400);
		});
		it('should return an error when the start parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-agent')).set(credentials).query({ end: 'test' }).expect(400);
		});
		it('should return an error when the end parameter is not provided', async () => {
			await request.get(api('livechat/analytics/dashboards/conversations-by-agent')).set(credentials).query({ start: 'test' }).expect(400);
		});
		it('should return an error when the start parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: 'test', end: 'test' })
				.expect(400);
		});
		it('should return an error when the end parameter is not a valid date', async () => {
			await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: '2020-01-01', end: 'test' })
				.expect(400);
		});
		it('should return the proper data when the parameters are valid', async () => {
			// Note: this way all data will come as 0
			const now = new Date().toISOString();
			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: now, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('object');
			expect(Object.keys(body.data).length).to.be.equal(0);
			expect(body.success).to.be.true;
		});
		it('should return the proper data from a pipeline run :)', async () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
			const now = new Date().toISOString();

			const { body } = await request
				.get(api('livechat/analytics/dashboards/conversations-by-agent'))
				.set(credentials)
				.query({ start: oneHourAgo, end: now })
				.expect(200);

			expect(body).to.have.property('data').and.to.be.an('object');
			expect(body.data['RocketChat Internal Admin Test']).to.be.greaterThanOrEqual(1);
			expect(body.data.Unspecified).to.be.greaterThanOrEqual(1);
		});
	});
});
