import { expect } from 'chai';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createVisitor } from '../../../data/livechat/rooms.js';

describe('LIVECHAT - visitors', function () {
	this.retries(0);
	let visitor: ILivechatVisitor;

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true)
			.then(() => createVisitor())
			.then((createdVisitor) => {
				visitor = createdVisitor;
				done();
			});
	});

	describe('livechat/visitors.info', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', []).then(() => {
				request
					.get(api('livechat/visitors.info?visitorId=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
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
					.expect((res) => {
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
				.expect((res) => {
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
					.expect((res) => {
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
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
		it('should return an array of pages', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				request
					.get(api('livechat/visitors.pagesVisited/GENERAL'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
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

	describe('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', []).then(() => {
				request
					.get(api('livechat/visitors.chatHistory/room/room-id/visitor/visitor-id'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
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
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					})
					.end(done);
			});
		});
		it('should return an array of chat history', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				request
					.get(api(`livechat/visitors.chatHistory/room/GENERAL/visitor/${visitor._id}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
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

	describe('livechat/visitor', () => {
		it("should return a 'failure error' when scope of the custom field is equal to 'visitor' and livechatDataByToken cannot by updated", (done) => {
			request
				.get(api('livechat/visitor'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('failure');
				})
				.end(done);
		});

		it('should return an error when the "token" query parameter is not valid', (done) => {
			request
				.get(api('livechat/visitor?token=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return an error when the "name" query parameter is not valid', (done) => {
			request
				.get(api('livechat/visitor?name=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return an error when the "email" query parameter is not valid', (done) => {
			request
				.get(api('livechat/visitor?email=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return an error when the "department" query parameter is not valid', (done) => {
			request
				.get(api('livechat/visitor?department=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return an error when the "phone" query parameter is not valid', (done) => {
			request
				.get(api('livechat/visitor?phone=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return an error when the "username" query parameter is not valid', (done) => {
			request
				.get(api('livechat/visitor?username=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return an error when the "customFields" query parameter is not valid', (done) => {
			request
				.get(api('livechat/visitor?customFields=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return nothing when there is no customField', (done) => {
			request
				.get(api(`livechat/visitor?token=123&name=John&email=test@gmail.com&department=test&phone=123456789&customFields={}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.rooms).to.equal(null);
				})
				.end(done);
		});

		it('should return a visitor when the query params is all valid', (done) => {
			request
				.get(
					api(
						`livechat/visitor?token=123&name=John&email=test@gmail.com&department=test&phone=123456789&customFields={"key": "123", "value": "test", "overwrite": "false"}`,
					),
				)
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.rooms).to.be.an('object');
					expect(res.body).to.have.property('visitor');
				})
				.end(done);
		});
	});

	describe('livechat/visitor/:token', () => {
		// get
		it("should return a 'invalid token' error when visitor with given token does not exist ", (done) => {
			request
				.get(api('livechat/visitor/:token=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('invalid-token');
				})
				.end(done);
		});

		it('should return an error when the "token" query parameter is not valid', (done) => {
			request
				.get(api('livechat/visitor/:token=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it('should return a visitor when the query params is all valid', (done) => {
			request
				.get(api(`livechat/visitor/:token=123`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.rooms).to.be.an('object');
					expect(res.body).to.have.property('visitor');
				})
				.end(done);
		});

		// delete
		it("should return a 'invalid token' error when visitor with given token does not exist ", (done) => {
			request
				.delete(api('livechat/visitor/:token=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('invalid-token');
				})
				.end(done);
		});

		it('should return an error when the "token" query parameter is not valid', (done) => {
			request
				.delete(api('livechat/visitor/:token=invalid'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});

		it("should return a 'visitor-has-open-rooms' error when there are open rooms", (done) => {
			request
				.delete(api('livechat/visitor/:token=123'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('visitor-has-open-rooms');
				})
				.end(done);
		});

		it("should return a 'error-removing-visitor' error when removeGuest's result is false", (done) => {
			request
				.delete(api('livechat/visitor/:token=123'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('visitor-has-open-rooms');
				})
				.end(done);
		});

		it('should return a visitor when the query params is all valid', (done) => {
			request
				.delete(api(`livechat/visitor/:token=123`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.rooms).to.be.an('object');
					expect(res.body).to.have.property('visitor');
					expect(res.body).to.have.property('visitor').that.includes('_id');
					expect(res.body).to.have.property('visitor').that.includes('ts');
				})
				.end(done);
		});
	});
});
