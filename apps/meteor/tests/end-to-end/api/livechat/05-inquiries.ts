/* eslint-env mocha */

import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createAgent, createLivechatRoom, createVisitor, fetchInquiry, makeAgentAvailable } from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - inquiries', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true)
			.then(() => updateSetting('Livechat_Routing_Method', 'Manual_Selection'))
			.then(() => done());
	});

	describe('livechat/inquiries.list', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', [])
				.then(() => {
					request.get(api('livechat/inquiries.list')).set(credentials).expect('Content-Type', 'application/json').expect(403);
				})
				.then(() => done());
		});
		it('should return an array of inquiries', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request
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
				})
				.then(() => done());
		});
	});

	describe('livechat/inquiries.queued', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', [])
				.then(() => {
					request.get(api('livechat/inquiries.queued')).set(credentials).expect('Content-Type', 'application/json').expect(403);
				})
				.then(() => done());
		});
		it('should return an array of inquiries', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => {
					request
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
				})
				.then(() => done());
		});
	});

	describe('livechat/inquiries.getOne', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', [])
				.then(() => {
					request
						.get(api('livechat/inquiries.getOne?roomId=room-id'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403);
				})
				.then(() => done());
		});
		it('should return a inquiry', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => {
					request
						.get(api('livechat/inquiries.getOne?roomId=room-id'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('inquiry');
						});
				})
				.then(() => done());
		});
	});

	describe('POST livechat/inquiries.take', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', [])
				.then(() => {
					request
						.post(api('livechat/inquiries.take'))
						.set(credentials)
						.send({ inquiryId: 'room-id' })
						.expect('Content-Type', 'application/json')
						.expect(403);
				})
				.then(() => done());
		}).timeout(5000);
		it('should throw an error when userId is provided but is invalid', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent'])
				.then(() => {
					request
						.post(api('livechat/inquiries.take'))
						.set(credentials)
						.send({ inquiryId: 'room-id', userId: 'invalid-user-id' })
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
						});
				})
				.then(() => done());
		});

		it('should throw an error if inquiryId is not an string', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent'])
				.then(() => {
					request
						.post(api('livechat/inquiries.take'))
						.set(credentials)
						.send({ inquiryId: { regexxxx: 'bla' }, userId: 'user-id' })
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
						});
				})
				.then(() => done());
		});

		it('should take an inquiry if all params are good', (done) => {
			updatePermission('view-l-room', ['admin', 'livechat-agent'])
				.then(() => createAgent())
				.then((agent) => Promise.all([agent, createVisitor(), makeAgentAvailable()]))
				.then(([agent, visitor]) => Promise.all([agent, createLivechatRoom(visitor.token)]))
				.then(([agent, room]) => Promise.all([agent, fetchInquiry(room._id)]))
				.then(([agent, inquiry]) => {
					request
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
							expect(res.body).to.have.property('inquiry');
							expect(res.body.inquiry).to.have.property('servedBy');
							expect(res.body.inquiry.servedBy).to.have.property('_id', agent._id);
							expect(res.body.inquiry.source.type).to.equal('api');
						});
				})
				.then(() => done());
		}).timeout(5000);
	});

	describe('livechat/inquiries.queuedForUser', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', [])
				.then(() => {
					request.get(api('livechat/inquiries.queued')).set(credentials).expect('Content-Type', 'application/json').expect(403);
				})
				.then(() => done());
		});
		it('should return an array of inquiries', (done) => {
			updatePermission('view-l-room', ['admin'])
				.then(() => {
					request
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
				})
				.then(() => done());
		});
	});
});
