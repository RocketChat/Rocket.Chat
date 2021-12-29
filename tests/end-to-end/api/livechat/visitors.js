import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../../data/api-data.js';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createVisitor } from '../../../data/livechat/rooms.js';

describe('LIVECHAT - visitors', function () {
	this.retries(0);
	let visitor;

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
});
