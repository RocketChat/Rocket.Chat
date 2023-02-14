import type { IEmailInbox } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createDepartment } from '../../../data/livechat/rooms';
import { createEmailInbox } from '../../../data/livechat/inboxes';
import { updatePermission } from '../../../data/permissions.helper';

describe('Email inbox', () => {
	before((done) => getCredentials(done));
	let testInbox = '';
	before((done) => {
		createDepartment()
			.then((dept) =>
				request
					.post(api('email-inbox'))
					.set(credentials)
					.send({
						active: true,
						name: 'test-email-inbox##',
						email: 'test-email@example.com',
						description: 'test email inbox',
						senderInfo: 'test email inbox',
						department: dept.name,
						smtp: {
							server: 'smtp.example.com',
							port: 587,
							username: 'example@example.com',
							password: 'not-a-real-password',
							secure: true,
						},
						imap: {
							server: 'imap.example.com',
							port: 993,
							username: 'example@example.com',
							password: 'not-a-real-password',
							secure: true,
							maxRetries: 10,
						},
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success');
						if (res.body.success === true) {
							testInbox = res.body._id;
						} else {
							expect(res.body).to.have.property('error');
							expect(res.body.error.includes('E11000')).to.be.eq(true);
						}
					}),
			)
			.finally(done);
	});
	after((done) => {
		if (testInbox) {
			request
				.delete(api(`email-inbox/${testInbox}`))
				.set(credentials)
				.send()
				.expect(200)
				.end(() => done());
			return;
		}
		done();
	});
	describe('GET email-inbox.list', () => {
		it('should fail if user doesnt have manage-email-inbox permission', async () => {
			await updatePermission('manage-email-inbox', []);
			await request.get(api('email-inbox.list')).set(credentials).expect(403);
		});
		it('should return a list of email inboxes', async () => {
			await updatePermission('manage-email-inbox', ['admin']);
			const res = await request.get(api('email-inbox.list')).set(credentials).send().expect('Content-Type', 'application/json').expect(200);

			expect(res.body).to.have.property('emailInboxes');
			expect(res.body.emailInboxes).to.be.an('array');
			expect(res.body.emailInboxes).to.have.length.of.at.least(1);
			expect(res.body.emailInboxes.filter((ibx: IEmailInbox) => ibx.email === 'test-email@example.com')).to.have.length.gte(1);
			// make sure we delete the test inbox, even if creation failed on this test run
			testInbox = res.body.emailInboxes.filter((ibx: IEmailInbox) => ibx.email === 'test-email@example.com')[0]._id;
			expect(res.body).to.have.property('total');
			expect(res.body.total).to.be.a('number');
			expect(res.body).to.have.property('count');
			expect(res.body.count).to.be.a('number');
			expect(res.body).to.have.property('offset');
			expect(res.body.offset).to.be.a('number');
		});
	});

	describe('POST email-inbox', () => {
		let inboxId: string;
		const mockedPayload = {
			name: 'test',
			active: false,
			email: `test${new Date().getTime()}@test.com`,
			description: 'Updated test description',
			senderInfo: 'test',
			department: 'test',
			smtp: {
				server: 'smtp.example.com',
				port: 587,
				username: 'xxxx',
				password: 'xxxx',
				secure: true,
			},
			imap: {
				server: 'imap.example.com',
				port: 993,
				username: 'xxxx',
				password: 'xxxx',
				secure: true,
				maxRetries: 10,
			},
		};
		it('should fail if user doesnt have manage-email-inbox permission', async () => {
			await updatePermission('manage-email-inbox', []);
			await request.post(api('email-inbox')).set(credentials).send({}).expect(403);
		});
		it('should fail if smtp config is not on body params', async () => {
			await updatePermission('manage-email-inbox', ['admin']);
			await request.post(api('email-inbox')).set(credentials).send({}).expect(400);
		});
		it('should fail if imap config is not on body params', async () => {
			const { imap, ...payload } = mockedPayload;
			await request.post(api('email-inbox')).set(credentials).send(payload).expect(400);
		});
		it('should fail if name is not on body params', async () => {
			await updatePermission('manage-email-inbox', ['admin']);
			const { name, ...payload } = mockedPayload;
			await request.post(api('email-inbox')).set(credentials).send(payload).expect(400);
		});
		it('should fail if active is not on body params', async () => {
			await updatePermission('manage-email-inbox', ['admin']);
			const { active, ...payload } = mockedPayload;
			await request.post(api('email-inbox')).set(credentials).send(payload).expect(400);
		});
		it('should fail if email is not on body params', async () => {
			await updatePermission('manage-email-inbox', ['admin']);
			const { email, ...payload } = mockedPayload;
			await request.post(api('email-inbox')).set(credentials).send(payload).expect(400);
		});
		it('should save an email inbox', async () => {
			await updatePermission('manage-email-inbox', ['admin']);
			const { email, ...payload } = mockedPayload;
			const { body } = await request
				.post(api('email-inbox'))
				.set(credentials)
				.send({
					...payload,
					email: `test${new Date().getTime()}@test.com`,
				})
				.expect(200);

			expect(body).to.have.property('_id');
			inboxId = body._id;
		});
		it('should update an email inbox when _id is passed in the object', async () => {
			await updatePermission('manage-email-inbox', ['admin']);
			const { body } = await request
				.post(api('email-inbox'))
				.set(credentials)
				.send({
					...mockedPayload,
					_id: inboxId,
					description: 'Updated test description',
				})
				.expect(200);

			expect(body).to.have.property('_id');
		});
	});
	describe('GET email-inbox/:_id', () => {
		it('should fail if user doesnt have manage-email-inbox permission', async () => {
			await updatePermission('manage-email-inbox', []);
			await request.get(api('email-inbox/123')).set(credentials).expect(403);
		});
		it('should fail when email inbox does not exist', async () => {
			await updatePermission('manage-email-inbox', ['admin']);
			await request.get(api('email-inbox/123')).set(credentials).expect(404);
		});
		it('should return an email inbox', async () => {
			const inbox = await createEmailInbox();
			const { body } = await request
				.get(api(`email-inbox/${inbox._id}`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.property('_id');
			expect(body).to.have.property('name', 'test');
		});
	});
	describe('DELETE email-inbox/:_id', () => {
		it('should fail if user doesnt have manage-email-inbox permission', async () => {
			await updatePermission('manage-email-inbox', []);
			await request.delete(api('email-inbox/123')).set(credentials).expect(403);
		});
		it('should return nothing when email inbox does not exist', async () => {
			await updatePermission('manage-email-inbox', ['admin']);
			await request.delete(api('email-inbox/123')).set(credentials).expect(404);
		});
		it('should delete an email inbox', async () => {
			const inbox = await createEmailInbox();
			const { body } = await request
				.delete(api(`email-inbox/${inbox._id}`))
				.set(credentials)
				.expect(200);

			expect(body).to.have.property('success', true);
		});
	});
	describe('GET email-inbox.search', () => {
		it('should fail if user doesnt have manage-email-inbox permission', async () => {
			await updatePermission('manage-email-inbox', []);
			await request.get(api('email-inbox.search')).set(credentials).expect(403);
		});
		it('should return an email inbox matching email', async () => {
			await createEmailInbox();
			await updatePermission('manage-email-inbox', ['admin']);
			await request.get(api(`email-inbox.search?email=test`)).set(credentials).expect(200);
		});
	});
});
