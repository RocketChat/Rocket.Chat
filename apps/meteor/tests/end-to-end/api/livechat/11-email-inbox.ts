import type { IEmailInbox } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createDepartment } from '../../../data/livechat/rooms';

// TODO: Add tests with actual e-mail servers involved

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
		it('should return a list of email inboxes', (done) => {
			request
				.get(api('email-inbox.list'))
				.set(credentials)
				.send()
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
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
				})
				.end(() => done());
		});
	});
});
