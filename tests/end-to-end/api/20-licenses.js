import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { password } from '../../data/user.js';
import { createUser, login as doLogin } from '../../data/users.helper';

describe('licenses', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/licenses.add]', () => {
		let unauthorizedUserCredentials;
		before(async () => {
			const createdUser = await createUser();
			unauthorizedUserCredentials = await doLogin(createdUser.username, password);
		});

		it('should fail if not logged in', (done) => {
			request.post(api('licenses.add'))
				.send({
					license: 'gKgQ9GGRadt59ndZJrLJ+nWXJcUbE6e8X7jF1VO+bzMv3PKrRAMyh/14Evkl4jF1UX4qtROw5JD1YdLoDrlZFaMLjDU1mEHRd5HaPciyj7i9rmoZ18edqlmZoivAZvZovt0SPHGAkBdqRxnBTnb+8sfCKzp/wybH5VNyrjNy2Ru70px69qTNiNmRgUS2wrpY9LYw4YXAwRvSSMsD8u9ptdr4wgYhIYJP0pf5JF+ko7ifEsmJDcGVkTr4njvSeoPLkzV+hunUY3VSXVpe58+efMw8fEMd9b8wCV7JT690cwW7BYwdYpSaqbgIGY8PlQBqWGOUB9qa10WqEYBfX53nlevMzWpGgk6sJGSd4gUFHtJEpHWj+QJsCfvx6FcS6bx+n4CqaD6k+iIaAmEn6hcv67/qyi19lSQgBXiIf0J+JWS6zkjcVb09PII/t2nxcD1jTUnX6oLXtmmZ9eSho20FVWswbbJEvFzY8ID+CcimYA3iHTtyT4ulCzLinLJSUteM7lSBIJhPgev9qV19XEfOWpOGlePJP3liBCdb77kr2Gu2p7FD+AqdZiv2o04olChwCGBDpZYvMpNYCRItUE3gTgl4x2WWepk+TXf2ZpNKrWtapLiw928B2/UCWFGRc0Gs+forw5wKXImFo5FIJFXUeeTITzKk0HVkh8Fs/tLBmuI'
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if user is unauthorized', (done) => {
			request.post(api('licenses.add'))
				.set(unauthorizedUserCredentials)
				.send({
					license: 'gKgQ9GGRadt59ndZJrLJ+nWXJcUbE6e8X7jF1VO+bzMv3PKrRAMyh/14Evkl4jF1UX4qtROw5JD1YdLoDrlZFaMLjDU1mEHRd5HaPciyj7i9rmoZ18edqlmZoivAZvZovt0SPHGAkBdqRxnBTnb+8sfCKzp/wybH5VNyrjNy2Ru70px69qTNiNmRgUS2wrpY9LYw4YXAwRvSSMsD8u9ptdr4wgYhIYJP0pf5JF+ko7ifEsmJDcGVkTr4njvSeoPLkzV+hunUY3VSXVpe58+efMw8fEMd9b8wCV7JT690cwW7BYwdYpSaqbgIGY8PlQBqWGOUB9qa10WqEYBfX53nlevMzWpGgk6sJGSd4gUFHtJEpHWj+QJsCfvx6FcS6bx+n4CqaD6k+iIaAmEn6hcv67/qyi19lSQgBXiIf0J+JWS6zkjcVb09PII/t2nxcD1jTUnX6oLXtmmZ9eSho20FVWswbbJEvFzY8ID+CcimYA3iHTtyT4ulCzLinLJSUteM7lSBIJhPgev9qV19XEfOWpOGlePJP3liBCdb77kr2Gu2p7FD+AqdZiv2o04olChwCGBDpZYvMpNYCRItUE3gTgl4x2WWepk+TXf2ZpNKrWtapLiw928B2/UCWFGRc0Gs+forw5wKXImFo5FIJFXUeeTITzKk0HVkh8Fs/tLBmuI'
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				})
				.end(done);
		});

		it('should fail if license is invalid', (done) => {
			request.post(api('licenses.add'))
				.set(credentials)
				.send({
					license: ''
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});

		it('should return success if license is valid', (done) => {
			request.post(api('licenses.add'))
				.set(credentials)
				.send({
					license: 'gKgQ9GGRadt59ndZJrLJ+nWXJcUbE6e8X7jF1VO+bzMv3PKrRAMyh/14Evkl4jF1UX4qtROw5JD1YdLoDrlZFaMLjDU1mEHRd5HaPciyj7i9rmoZ18edqlmZoivAZvZovt0SPHGAkBdqRxnBTnb+8sfCKzp/wybH5VNyrjNy2Ru70px69qTNiNmRgUS2wrpY9LYw4YXAwRvSSMsD8u9ptdr4wgYhIYJP0pf5JF+ko7ifEsmJDcGVkTr4njvSeoPLkzV+hunUY3VSXVpe58+efMw8fEMd9b8wCV7JT690cwW7BYwdYpSaqbgIGY8PlQBqWGOUB9qa10WqEYBfX53nlevMzWpGgk6sJGSd4gUFHtJEpHWj+QJsCfvx6FcS6bx+n4CqaD6k+iIaAmEn6hcv67/qyi19lSQgBXiIf0J+JWS6zkjcVb09PII/t2nxcD1jTUnX6oLXtmmZ9eSho20FVWswbbJEvFzY8ID+CcimYA3iHTtyT4ulCzLinLJSUteM7lSBIJhPgev9qV19XEfOWpOGlePJP3liBCdb77kr2Gu2p7FD+AqdZiv2o04olChwCGBDpZYvMpNYCRItUE3gTgl4x2WWepk+TXf2ZpNKrWtapLiw928B2/UCWFGRc0Gs+forw5wKXImFo5FIJFXUeeTITzKk0HVkh8Fs/tLBmuI'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('[/licenses.get]', () => {
		let unauthorizedUserCredentials;
		before(async () => {
			const createdUser = await createUser();
			unauthorizedUserCredentials = await doLogin(createdUser.username, password);
		});

		it('should fail if not logged in', (done) => {
			request.get(api('licenses.get'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if user is unauthorized', (done) => {
			request.get(api('licenses.get'))
				.set(unauthorizedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				})
				.end(done);
		});

		it('should return licenses if user is logged in and is authorized', (done) => {
			request.get(api('licenses.get'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('licenses').and.to.be.an('array');

					const {licenses: [license]} = res.body;

					expect(license).to.have.property('url');
					expect(license).to.have.property('expiry');
					expect(license).to.have.property('modules').and.to.be.an('array');
					expect(license).to.have.property('maxActiveUsers');
					expect(license).to.have.property('maxGuestUsers');
					expect(license).to.have.property('maxRoomsPerGuest');
				})

				.end(done);
		});
	});
});
