import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('Invites', function () {
	let testInviteID;
	this.retries(0);

	before((done) => getCredentials(done));
	describe('POST [/findOrCreateInvite]', () => {
		it('should fail if not logged in', (done) => {
			request
				.post(api('findOrCreateInvite'))
				.send({
					rid: 'GENERAL',
					days: 1,
					maxUses: 10,
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if invalid roomid', (done) => {
			request
				.post(api('findOrCreateInvite'))
				.set(credentials)
				.send({
					rid: 'invalid',
					days: 1,
					maxUses: 10,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-room');
				})
				.end(done);
		});

		it('should create an invite for GENERAL', (done) => {
			request
				.post(api('findOrCreateInvite'))
				.set(credentials)
				.send({
					rid: 'GENERAL',
					days: 1,
					maxUses: 10,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('days', 1);
					expect(res.body).to.have.property('maxUses', 10);
					expect(res.body).to.have.property('uses');
					expect(res.body).to.have.property('_id');
					testInviteID = res.body._id;
				})
				.end(done);
		});

		it('should return an existing invite for GENERAL', (done) => {
			request
				.post(api('findOrCreateInvite'))
				.set(credentials)
				.send({
					rid: 'GENERAL',
					days: 1,
					maxUses: 10,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('days', 1);
					expect(res.body).to.have.property('maxUses', 10);
					expect(res.body).to.have.property('uses');
					expect(res.body).to.have.property('_id', testInviteID);
				})
				.end(done);
		});
	});

	describe('GET [/listInvites]', () => {
		it('should fail if not logged in', (done) => {
			request
				.get(api('listInvites'))
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return the existing invite for GENERAL', (done) => {
			request
				.get(api('listInvites'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body[0]).to.have.property('_id', testInviteID);
				})
				.end(done);
		});
	});

	describe('POST [/useInviteToken]', () => {
		it('should fail if not logged in', (done) => {
			request
				.post(api('useInviteToken'))
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if invalid token', (done) => {
			request
				.post(api('useInviteToken'))
				.set(credentials)
				.send({
					token: 'invalid',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-token');
				})
				.end(done);
		});

		it('should fail if missing token', (done) => {
			request
				.post(api('useInviteToken'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				})
				.end(done);
		});

		it('should use the existing invite for GENERAL', (done) => {
			request
				.post(api('useInviteToken'))
				.set(credentials)
				.send({
					token: testInviteID,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('POST [/validateInviteToken]', () => {
		it('should warn if invalid token', (done) => {
			request
				.post(api('validateInviteToken'))
				.set(credentials)
				.send({
					token: 'invalid',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('valid', false);
				})
				.end(done);
		});

		it('should succeed when valid token', (done) => {
			request
				.post(api('validateInviteToken'))
				.set(credentials)
				.send({
					token: testInviteID,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('valid', true);
				})
				.end(done);
		});
	});

	describe('DELETE [/removeInvite]', () => {
		it('should fail if not logged in', (done) => {
			request
				.delete(api(`removeInvite/${testInviteID}`))
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if invalid token', (done) => {
			request
				.delete(api('removeInvite/invalid'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-invitation-id');
				})
				.end(done);
		});

		it('should succeed when valid token', (done) => {
			request
				.delete(api(`removeInvite/${testInviteID}`))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.equal(true);
				})
				.end(done);
		});

		it('should fail when deleting the same invite again', (done) => {
			request
				.delete(api(`removeInvite/${testInviteID}`))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-invitation-id');
				})
				.end(done);
		});
	});
});
