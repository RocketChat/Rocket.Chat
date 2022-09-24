import { expect } from 'chai';
import type { Response } from 'supertest';

import { api, request, credentials } from '../../../data/api-data';

describe('Mailer', () => {
	describe('POST mailer', () => {
		it('should send an email if the payload is correct', (done) => {
			request
				.post(api('mailer'))
				.set(credentials)
				.send({
					from: 'test-email@example.com',
					subject: 'Test email subject',
					body: 'Test email body',
					dryrun: true,
					query: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(() => done());
		});
		it('should throw an error if the request is incorrect', (done) => {
			request
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
				})
				.end(() => done());
		});
		it('should throw an error if the "from" param is missing', (done) => {
			request
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
				})
				.end(() => done());
		});
	});
});

describe('Mailer Unsubscribe', () => {
	describe('POST mailer unsubscribe', () => {
		it('should unsubscribe to mailer if the request is correct', (done) => {
			request
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
				})
				.end(() => done());
		});
		it('should throw an error if the "_id" param is missing', (done) => {
			request
				.post(api('mailer.unsubscribe'))
				.set(credentials)
				.send({
					createdAt: new Date().getTime().toString(),
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(() => done());
		});
		it('should throw an error if the "createdAt" param is missing', (done) => {
			request
				.post(api('mailer.unsubscribe'))
				.set(credentials)
				.send({
					_id: credentials['X-User-Id'],
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(() => done());
		});
	});
});
