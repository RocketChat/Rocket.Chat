import { expect } from 'chai';
import { before, after, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { api, request, credentials, getCredentials } from '../../../data/api-data';
import { updatePermission } from '../../../data/permissions.helper';

describe('Mailer', () => {
	before((done) => getCredentials(done));

	describe('POST mailer', async () => {
		before(async () => {
			return updatePermission('send-mail', ['admin']);
		});

		after(async () => {
			return updatePermission('send-mail', ['admin']);
		});

		it('should send an email if the payload is correct', async () => {
			await request
				.post(api('mailer'))
				.set(credentials)
				.send({
					from: 'rocketchat.internal.admin.test@rocket.chat',
					subject: 'Test email subject',
					body: 'Test email body [unsubscribe]',
					dryrun: true,
					query: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});
		it('should throw an error if the request is incorrect', async () => {
			await request
				.post(api('mailer'))
				.set(credentials)
				.send({
					from: 12345,
					subject: {},
					body: 'Test email body',
					dryrun: true,
					query: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should throw an error if the "from" param is missing', async () => {
			await request
				.post(api('mailer'))
				.set(credentials)
				.send({
					subject: 'Test email subject',
					body: 'Test email body',
					dryrun: true,
					query: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should throw an error if user does NOT have the send-mail permission', async () => {
			await updatePermission('send-mail', []);
			await request
				.post(api('mailer'))
				.set(credentials)
				.send({
					from: 'test-mail@test.com',
					subject: 'Test email subject',
					body: 'Test email body',
					dryrun: true,
					query: '',
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

describe('Mailer Unsubscribe', () => {
	describe('POST mailer unsubscribe', () => {
		it('should unsubscribe to mailer if the request is correct', async () => {
			await request
				.post(api('mailer.unsubscribe'))
				.set(credentials)
				.send({
					_id: credentials['X-User-Id'],
					createdAt: new Date().getTime().toString(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});
		it('should throw an error if the "_id" param is missing', async () => {
			await request
				.post(api('mailer.unsubscribe'))
				.set(credentials)
				.send({
					createdAt: new Date().getTime().toString(),
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
		it('should throw an error if the "createdAt" param is missing', async () => {
			await request
				.post(api('mailer.unsubscribe'))
				.set(credentials)
				.send({
					_id: credentials['X-User-Id'],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				});
		});
	});
});
