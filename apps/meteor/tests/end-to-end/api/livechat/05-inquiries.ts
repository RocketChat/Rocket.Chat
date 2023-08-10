import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createAgent, createLivechatRoom, createVisitor, fetchInquiry, makeAgentAvailable } from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - inquiries', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(async () => {
		await updateSetting('Livechat_enabled', true);
		await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
	});

	describe('livechat/inquiries.list', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-livechat-manager', []);
			await request.get(api('livechat/inquiries.list')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should return an array of inquiries', async () => {
			await updatePermission('view-livechat-manager', ['admin']);
			await request
				.get(api('livechat/inquiries.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.inquiries).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
	});

	describe('livechat/inquiries.queued', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/inquiries.queued')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should return an array of inquiries', async () => {
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/inquiries.queued'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.inquiries).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
	});

	describe('livechat/inquiries.getOne', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request
				.get(api('livechat/inquiries.getOne?roomId=room-id'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403);
		});
		it('should return a inquiry', async () => {
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/inquiries.getOne?roomId=room-id'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('inquiry');
				});
		});

		it('should get an inquiry by room id', async () => {
			await createAgent();
			const visitor = await createVisitor();
			await makeAgentAvailable();
			const room = await createLivechatRoom(visitor.token);
			const inquiry = await fetchInquiry(room._id);
			await request
				.get(api(`livechat/inquiries.getOne?roomId=${room._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('inquiry');
					expect(res.body.inquiry).to.have.property('_id', inquiry._id);
					expect(res.body.inquiry).to.have.property('rid', room._id);
					expect(res.body.inquiry).to.have.property('ts');
					expect(res.body.inquiry.ts).to.be.a('string');
					expect(res.body.inquiry).to.have.property('status', 'queued');
					expect(res.body.inquiry).to.have.property('name', visitor.name);
					expect(res.body.inquiry).to.have.property('t', 'l');
					expect(res.body.inquiry).to.have.property('priorityWeight');
					expect(res.body.inquiry).to.have.property('estimatedWaitingTimeQueue');
					expect(res.body.inquiry.source).to.have.property('type', 'api');
					expect(res.body.inquiry).to.have.property('_updatedAt');
					expect(res.body.inquiry).to.have.property('queuedAt');
					expect(res.body.inquiry).to.have.property('v').and.be.an('object');
					expect(res.body.inquiry.v).to.have.property('_id', visitor._id);
				});
		});
	});

	describe('POST livechat/inquiries.take', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request
				.post(api('livechat/inquiries.take'))
				.set(credentials)
				.send({ inquiryId: 'room-id' })
				.expect('Content-Type', 'application/json')
				.expect(403);
		}).timeout(5000);
		it('should throw an error when userId is provided but is invalid', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await request
				.post(api('livechat/inquiries.take'))
				.set(credentials)
				.send({ inquiryId: 'room-id', userId: 'invalid-user-id' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should throw an error if inquiryId is not an string', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			await request
				.post(api('livechat/inquiries.take'))
				.set(credentials)
				.send({ inquiryId: { regexxxx: 'bla' }, userId: 'user-id' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should take an inquiry if all params are good', async () => {
			await updatePermission('view-l-room', ['admin', 'livechat-agent']);
			const agent = await createAgent();
			const visitor = await createVisitor();
			await makeAgentAvailable();
			const room = await createLivechatRoom(visitor.token);
			const inquiry = await fetchInquiry(room._id);

			await request
				.post(api('livechat/inquiries.take'))
				.set(credentials)
				.send({
					inquiryId: inquiry._id,
					userId: agent._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
			const inquiry2 = (await fetchInquiry(room._id)) as ILivechatInquiryRecord;
			expect(inquiry2.source.type).to.equal('api');
			expect(inquiry2.status).to.equal('taken');
		}).timeout(5000);
	});

	describe('livechat/inquiries.queuedForUser', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', async () => {
			await updatePermission('view-l-room', []);
			await request.get(api('livechat/inquiries.queued')).set(credentials).expect('Content-Type', 'application/json').expect(403);
		});
		it('should return an array of inquiries', async () => {
			await updatePermission('view-l-room', ['admin']);
			await request
				.get(api('livechat/inquiries.queuedForUser'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.inquiries).to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				});
		});
		it('should validate all returned inquiries are queued', async () => {
			await request
				.get(api('livechat/inquiries.queuedForUser'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect(async (res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.inquiries).to.be.an('array');
					for (const inquiry of res.body.inquiries) {
						expect(inquiry).to.have.property('status', 'queued');
					}
				});
		});
	});
});
