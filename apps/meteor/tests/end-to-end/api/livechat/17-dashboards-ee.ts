import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import {
	createVisitor,
	createLivechatRoom,
	takeInquiry,
	closeOmnichannelRoom,
	makeAgentUnavailable,
	makeAgentAvailable,
	createAgent,
	sendAgentMessage,
	sendMessage,
	fetchInquiry,
} from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - dashboards', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await createAgent();
	});

	describe('livechat/analytics/agents/average-service-time', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/agents/average-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/agents/average-service-time'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/agents/average-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/agents/average-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/agents/average-service-time'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of agents', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const inq = await fetchInquiry(room._id);
			await takeInquiry(inq._id);
			await closeOmnichannelRoom(room._id);

			const { body } = await request
				.get(api('livechat/analytics/agents/average-service-time'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.agents).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.agents[0]).to.have.a.property('_id');
			expect(body.agents[0]).to.have.a.property('username');
			expect(body.agents[0]).to.have.a.property('averageServiceTimeInSeconds').that.is.a('number');
		});
	});
	describe('livechat/analytics/agents/total-service-time', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/agents/total-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/agents/total-service-time'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/agents/total-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/agents/total-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/agents/total-service-time'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of agents', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const { body } = await request
				.get(api('livechat/analytics/agents/total-service-time'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.agents).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.agents[0]).to.have.a.property('_id');
			expect(body.agents[0]).to.have.a.property('username');
			expect(body.agents[0]).to.have.a.property('serviceTimeDuration').that.is.a('number');
		});
	});
	describe('livechat/analytics/agents/available-for-service-history', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/agents/available-for-service-history'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/agents/available-for-service-history'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/agents/available-for-service-history'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/agents/available-for-service-history'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/agents/available-for-service-history'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of agents', async () => {
			// Toggling to populate agent activity collection
			await createAgent();
			await makeAgentUnavailable();
			await makeAgentAvailable();

			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const { body } = await request
				.get(api('livechat/analytics/agents/available-for-service-history'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.agents).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.agents[0]).to.have.a.property('username');
			expect(body.agents[0]).to.have.a.property('availableTimeInSeconds').that.is.a('number');
		});
	});
	describe('livechat/analytics/departments/amount-of-chats', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/departments/amount-of-chats'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/departments/amount-of-chats'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/departments/amount-of-chats'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/amount-of-chats'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/amount-of-chats'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of departments', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const { body } = await request
				.get(api('livechat/analytics/departments/amount-of-chats'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.departments).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.departments[0]).to.have.a.property('rooms').that.is.a('number');
			expect(body.departments[0]).to.have.a.property('_id');
		});
	});
	describe('livechat/analytics/departments/average-service-time', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/departments/average-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/departments/average-service-time'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/departments/average-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/average-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/average-service-time'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of departments', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const { body } = await request
				.get(api('livechat/analytics/departments/average-service-time'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.departments).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.departments[0]).to.have.a.property('averageServiceTimeInSeconds').that.is.a('number');
			expect(body.departments[0]).to.have.a.property('_id');
		});
	});
	describe('livechat/analytics/departments/average-chat-duration-time', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/departments/average-chat-duration-time'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/departments/average-chat-duration-time'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/departments/average-chat-duration-time'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/average-chat-duration-time'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/average-chat-duration-time'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of departments', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const { body } = await request
				.get(api('livechat/analytics/departments/average-chat-duration-time'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.departments).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.departments[0]).to.have.a.property('averageChatDurationTimeInSeconds').that.is.a('number');
			expect(body.departments[0]).to.have.a.property('_id');
		});
	});
	describe('livechat/analytics/departments/total-service-time', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/departments/total-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/departments/total-service-time'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/departments/total-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/total-service-time'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/total-service-time'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of departments', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const { body } = await request
				.get(api('livechat/analytics/departments/total-service-time'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.departments).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.departments[0]).to.have.a.property('chats').that.is.a('number');
			expect(body.departments[0]).to.have.a.property('serviceTimeDuration').that.is.a('number');
			expect(body.departments[0]).to.have.a.property('_id');
		});
	});
	describe('livechat/analytics/departments/average-waiting-time', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/departments/average-waiting-time'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/departments/average-waiting-time'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/departments/average-waiting-time'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/average-waiting-time'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/average-waiting-time'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of departments', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const { body } = await request
				.get(api('livechat/analytics/departments/average-waiting-time'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.departments).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.departments[0]).to.have.a.property('averageWaitingTimeInSeconds').that.is.a('number');
			expect(body.departments[0]).to.have.a.property('_id');
		});
	});
	describe('livechat/analytics/departments/total-transferred-chats', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/departments/total-transferred-chats'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/departments/total-transferred-chats'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/departments/total-transferred-chats'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/total-transferred-chats'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/total-transferred-chats'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of departments', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const { body } = await request
				.get(api('livechat/analytics/departments/total-transferred-chats'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.departments).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.departments[0]).to.have.a.property('numberOfTransferredRooms').that.is.a('number');
			expect(body.departments[0]).to.have.a.property('_id');
		});
	});
	describe('livechat/analytics/departments/total-abandoned-chats', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/departments/total-abandoned-chats'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/departments/total-abandoned-chats'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/departments/total-abandoned-chats'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/total-abandoned-chats'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/total-abandoned-chats'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of departments', async () => {
			await updateSetting('Livechat_visitor_inactivity_timeout', 0);
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const inq = await fetchInquiry(room._id);
			await takeInquiry(inq._id);
			await sendMessage(room._id, 'first message', visitor.token);
			await sendAgentMessage(room._id);
			await closeOmnichannelRoom(room._id);

			const { body } = await request
				.get(api('livechat/analytics/departments/total-abandoned-chats'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.departments).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.departments[0]).to.have.a.property('abandonedRooms').that.is.a('number');
			expect(body.departments[0]).to.have.a.property('_id');
		});
	});
	describe('livechat/analytics/departments/percentage-abandoned-chats', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request
				.get(api('livechat/analytics/departments/percentage-abandoned-chats'))
				.set(credentials)
				.query({ start: '2020-01-01', end: '2020-01-02' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should fail if start is not present as query param', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			const response = await request
				.get(api('livechat/analytics/departments/percentage-abandoned-chats'))
				.set(credentials)
				.query({ end: '2020-01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not present as query param', async () => {
			const response = await request
				.get(api('livechat/analytics/departments/percentage-abandoned-chats'))
				.set(credentials)
				.query({ start: '2020-01-01' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if start is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/percentage-abandoned-chats'))
				.set(credentials)
				.query({ start: '2020-01-01x', end: date })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if end is not a valid date', async () => {
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();
			const response = await request
				.get(api('livechat/analytics/departments/percentage-abandoned-chats'))
				.set(credentials)
				.query({ start: date, end: '2020-x01-02' })
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of departments', async () => {
			await updateSetting('Livechat_visitor_inactivity_timeout', 0);
			const date = new Date(new Date().setDate(new Date().getDate() - 2)).toISOString();

			const { body } = await request
				.get(api('livechat/analytics/departments/percentage-abandoned-chats'))
				.set(credentials)
				.query({ start: date, end: new Date().toISOString() })
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(body).to.have.property('success', true);
			expect(body.departments).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(body.departments[0]).to.have.a.property('percentageOfAbandonedChats').that.is.a('number');
			expect(body.departments[0]).to.have.a.property('_id');
		});
	});
});
