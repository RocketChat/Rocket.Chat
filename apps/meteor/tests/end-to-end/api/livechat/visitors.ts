import { expect } from 'chai';
import type { ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { makeAgentAvailable, createAgent, createLivechatRoom, createVisitor } from '../../../data/livechat/rooms.js';

describe('LIVECHAT - visitors', function () {
	this.retries(0);
	let visitor: ILivechatVisitor;

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true).then(() =>
			updatePermission('view-livechat-manager', ['admin']).then(() =>
				createAgent().then(() =>
					makeAgentAvailable().then(() =>
						createVisitor().then((createdVisitor) => {
							visitor = createdVisitor;
							done();
						}),
					),
				),
			),
		);
	});

	describe('livechat/visitors.info', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', []).then(() => {
				request
					.get(api('livechat/visitors.info?visitorId=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-authorized');
					})
					.end(done);
			});
		});
		it('should return an "visitor not found error" when the visitor doe snot exists', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				request
					.get(api('livechat/visitors.info?visitorId=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('visitor-not-found');
					})
					.end(done);
			});
		});
		it('should return the visitor info', (done) => {
			request
				.get(api(`livechat/visitors.info?visitorId=${visitor._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.visitor._id).to.be.equal(visitor._id);
				})
				.end(done);
		});
	});

	describe('livechat/visitors.pagesVisited', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', []).then(() => {
				request
					.get(api('livechat/visitors.pagesVisited/room-id'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-authorized');
					})
					.end(done);
			});
		});
		it('should return an "error" when the roomId param is not provided', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				request
					.get(api('livechat/visitors.pagesVisited/room-id'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
		it('should return an array of pages', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				createVisitor().then((createdVisitor: ILivechatVisitor) => {
					createLivechatRoom(createdVisitor.token).then((createdRoom: IOmnichannelRoom) => {
						request
							.get(api(`livechat/visitors.pagesVisited/${createdRoom._id}`))
							.set(credentials)
							.expect('Content-Type', 'application/json')
							.expect(200)
							.expect((res: Response) => {
								expect(res.body).to.have.property('success', true);
								expect(res.body.pages).to.be.an('array');
								expect(res.body).to.have.property('offset');
								expect(res.body).to.have.property('total');
								expect(res.body).to.have.property('count');
							})
							.end(done);
					});
				});
			});
		});
	});

	describe('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', []).then(() => {
				request
					.get(api('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-authorized');
					})
					.end(done);
			});
		});
		it('should return an "error" when the roomId param is invalid', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				request
					.get(api('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
		it('should return an array of chat history', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				createVisitor().then((createdVisitor: ILivechatVisitor) => {
					createLivechatRoom(createdVisitor.token).then((createdRoom: IOmnichannelRoom) => {
						request
							.get(api(`livechat/visitors.chatHistory/room/${createdRoom._id}/visitor/${createdVisitor._id}`))
							.set(credentials)
							.expect('Content-Type', 'application/json')
							.expect(200)
							.expect((res: Response) => {
								expect(res.body).to.have.property('success', true);
								expect(res.body.history).to.be.an('array');
								expect(res.body).to.have.property('offset');
								expect(res.body).to.have.property('total');
								expect(res.body).to.have.property('count');
							})
							.end(done);
					});
				});
			});
		});
	});

	describe('livechat/visitor/:token', () => {
		// get
		it("should return a 'invalid token' error when visitor with given token does not exist ", (done) => {
			request
				.get(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('[invalid-token]');
				})
				.end(done);
		});

		it('should return an error when the "token" query parameter is not valid', (done) => {
			request
				.get(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return a visitor when the query params is all valid', (done) => {
			request
				.get(api(`livechat/visitor/${visitor.token}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('visitor');
				})
				.end(done);
		});

		// delete
		it("should return a 'invalid token' error when visitor with given token does not exist ", (done) => {
			request
				.delete(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('[invalid-token]');
				})
				.end(done);
		});

		it('should return an error when the "token" query parameter is not valid', (done) => {
			request
				.delete(api('livechat/visitor/invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it("should return a 'visitor-has-open-rooms' error when there are open rooms", (done) => {
			createVisitor().then((createdVisitor: ILivechatVisitor) => {
				createLivechatRoom(createdVisitor.token).then(() => {
					request
						.delete(api(`livechat/visitor/${createdVisitor.token}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('Cannot remove visitors with opened rooms [visitor-has-open-rooms]');
						})
						.end(done);
				});
			});
		});

		it('should return a visitor when the query params is all valid', (done) => {
			createVisitor().then((createdVisitor: ILivechatVisitor) => {
				request
					.delete(api(`livechat/visitor/${createdVisitor.token}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('visitor');
						expect(res.body.visitor).to.have.property('_id');
						expect(res.body.visitor).to.have.property('ts');
						expect(res.body.visitor._id).to.be.equal(createdVisitor._id);
					})
					.end(done);
			});
		});

		it("should return a 'error-removing-visitor' error when removeGuest's result is false", (done) => {
			request
				.delete(api('livechat/visitor/123'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});
});

// TODO: Missing tests for the following endpoints:
// - /v1/livechat/visitor.status
// - /v1/livechat/visitor.callStatus
// - /v1/livechat/visitor/:token/room
// - /v1/livechat/visitor
