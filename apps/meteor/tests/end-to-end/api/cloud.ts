import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';

describe('[Cloud]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/cloud.manualRegister]', () => {
		before(async () => {
			return updatePermission('register-on-cloud', ['admin']);
		});

		after(async () => {
			return updatePermission('register-on-cloud', ['admin']);
		});

		it('should fail if user is not authenticated', async () => {
			return request
				.post(api('cloud.manualRegister'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res: Response) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message', 'You must be logged in to do this.');
				});
		});

		it('should fail when cloudBlob property is not provided', async () => {
			return request
				.post(api('cloud.manualRegister'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error', "must have required property 'cloudBlob' [invalid-params]");
				});
		});

		it('should fail when user does not have the register-on-cloud permission', async () => {
			await updatePermission('register-on-cloud', []);
			return request
				.post(api('cloud.manualRegister'))
				.set(credentials)
				.send({
					cloudBlob: 'test-blob',
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe('[/cloud.createRegistrationIntent]', () => {
		before(async () => {
			return updatePermission('manage-cloud', ['admin']);
		});

		after(async () => {
			return updatePermission('manage-cloud', ['admin']);
		});

		it('should fail if user is not authenticated', async () => {
			return request
				.post(api('cloud.createRegistrationIntent'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res: Response) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message', 'You must be logged in to do this.');
				});
		});

		it('should fail when resend property is not provided', async () => {
			return request
				.post(api('cloud.createRegistrationIntent'))
				.set(credentials)
				.send({
					email: 'test-mail@example.com',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error', "must have required property 'resend' [invalid-params]");
				});
		});

		it('should fail when email property is not provided', async () => {
			return request
				.post(api('cloud.createRegistrationIntent'))
				.set(credentials)
				.send({
					resend: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error', "must have required property 'email' [invalid-params]");
				});
		});

		it('should fail when user does not have the manage-cloud permission', async () => {
			await updatePermission('manage-cloud', []);
			return request
				.post(api('cloud.createRegistrationIntent'))
				.set(credentials)
				.send({
					email: 'test-mail@example.com',
					resend: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe('[/cloud.confirmationPoll]', () => {
		before(async () => {
			return updatePermission('manage-cloud', ['admin']);
		});

		after(async () => {
			return updatePermission('manage-cloud', ['admin']);
		});

		it('should fail if user is not authenticated', async () => {
			return request
				.get(api('cloud.confirmationPoll'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res: Response) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message', 'You must be logged in to do this.');
				});
		});

		it('should fail when deviceCode property is not provided', async () => {
			return request
				.get(api('cloud.confirmationPoll'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
					expect(res.body).to.have.property('error', "must have required property 'deviceCode' [invalid-params]");
				});
		});

		it('should fail when user does not have the manage-cloud permission', async () => {
			await updatePermission('manage-cloud', []);
			return request
				.get(api('cloud.confirmationPoll'))
				.set(credentials)
				.query({
					deviceCode: 'test-code',
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});
});
