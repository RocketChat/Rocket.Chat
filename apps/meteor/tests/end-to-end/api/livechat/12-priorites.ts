/* eslint-env mocha */

import type { ILivechatPriority } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { savePriority } from '../../../data/livechat/priorities';
import { createVisitor, createLivechatRoom, takeInquiry } from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { IS_EE } from '../../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('[EE] LIVECHAT - Priorities', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true)
			.then(() => updateSetting('Livechat_Routing_Method', 'Manual_Selection'))
			.then(done);
	});

	describe('livechat/priorities', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('manage-livechat-priorities', []);
			await updatePermission('view-l-room', []);
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should return an array of priorities', async () => {
			await updatePermission('manage-livechat-priorities', ['admin']);
			await updatePermission('view-l-room', ['livechat-agent']);
			const priority = await savePriority();
			const response = await request
				.get(api('livechat/priorities'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body.priorities).to.be.an('array').with.lengthOf.greaterThan(0);
			expect(response.body.priorities.find((p: ILivechatPriority) => p._id === priority._id)).to.be.an('object');
		});
	});

	describe('livechat/priorities/:priorityId', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('manage-livechat-priorities', []);
			await updatePermission('view-l-room', []);
			const response = await request
				.get(api('livechat/priorities/123'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should return a priority', async () => {
			await updatePermission('manage-livechat-priorities', ['admin']);
			await updatePermission('view-l-room', ['livechat-agent']);
			const priority = await savePriority();
			const response = await request
				.get(api(`livechat/priorities/${priority._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
			expect(response.body).to.be.an('object');
			expect(response.body._id).to.be.equal(priority._id);
		});
	});

	describe('livechat/inquiry.prioritize', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('manage-livechat-priorities', []);
			await updatePermission('view-l-room', []);
			const response = await request
				.put(api('livechat/inquiry.prioritize'))
				.set(credentials)
				.send({
					roomId: '123',
					priority: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(403);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if roomId is not in request body', async () => {
			await updatePermission('manage-livechat-priorities', ['admin']);
			await updatePermission('view-l-room', ['livechat-agent']);
			const response = await request
				.put(api('livechat/inquiry.prioritize'))
				.set(credentials)
				.send({
					priority: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if roomId is invalid', async () => {
			const response = await request
				.put(api('livechat/inquiry.prioritize'))
				.set(credentials)
				.send({
					roomId: '123',
					priority: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if priority is not in request body', async () => {
			const response = await request
				.put(api('livechat/inquiry.prioritize'))
				.set(credentials)
				.send({
					roomId: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if priority is not valid', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const response = await request
				.put(api('livechat/inquiry.prioritize'))
				.set(credentials)
				.send({
					roomId: room._id,
					priority: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should fail if inquiry is not queued', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			await takeInquiry(room._id);

			const response = await request
				.put(api('livechat/inquiry.prioritize'))
				.set(credentials)
				.send({
					roomId: room._id,
					priority: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(400);
			expect(response.body).to.have.property('success', false);
		});
		it('should prioritize an inquiry', async () => {
			const visitor = await createVisitor();
			const room = await createLivechatRoom(visitor.token);
			const priority = await savePriority();
			const response = await request
				.put(api('livechat/inquiry.prioritize'))
				.set(credentials)
				.send({
					roomId: room._id,
					priority: priority._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			expect(response.body).to.have.property('success', true);
		});
	});
});
