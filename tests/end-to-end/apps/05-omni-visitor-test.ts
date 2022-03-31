import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, request, credentials } from '../../data/api-data.js';
import { apps } from '../../data/apps/apps-data.js';
import { cleanupApps, installTestApp } from '../../data/apps/helper.js';

const createUniqueId = (): string => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const createRandomPhoneNumber = (): string => `+1${Math.floor(Math.random() * 10000000000)}`;
const createRandomEmail = (): string => `${createUniqueId()}@test.test`;

export type IVisitorWithPhoneNo = Omit<IVisitor, 'phone'> & { phone: Required<IVisitor['phone']> };
export type IVisitorWithEmail = Omit<IVisitor, 'visitorEmails'> & { visitorEmails: Required<IVisitor['visitorEmails']> };

const generateVisitor = (type: 'visitorWithUsernameAndId' | 'visitorWithPhoneNoAndUsername' | 'visitorWithEmailAndUsername'): IVisitor => {
	switch (type) {
		case 'visitorWithUsernameAndId': {
			const uniqueId = createUniqueId();
			return {
				id: uniqueId,
				token: uniqueId,
				username: `username-${uniqueId}`,
			} as IVisitor;
		}
		case 'visitorWithPhoneNoAndUsername': {
			const phoneNumber = createRandomPhoneNumber();
			return {
				token: createUniqueId(),
				phone: [{ phoneNumber }],
				username: phoneNumber,
			} as IVisitorWithPhoneNo;
		}
		case 'visitorWithEmailAndUsername': {
			const email = createRandomEmail();
			return {
				token: createUniqueId(),
				visitorEmails: [{ address: email }],
				username: email,
			} as IVisitorWithEmail;
		}
	}
};

describe('Omnichannel - Visitor Tests', function () {
	this.retries(0);
	let appId = '';

	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		appId = (await installTestApp()).id;
	});

	const visitors = {
		visitorWithUsernameAndId: generateVisitor('visitorWithUsernameAndId'),
		visitorWithPhoneNoAndUsername: generateVisitor('visitorWithPhoneNoAndUsername'),
		visitorWithEmailAndUsername: generateVisitor('visitorWithEmailAndUsername'),
	} as {
		visitorWithUsernameAndId: IVisitor;
		visitorWithPhoneNoAndUsername: IVisitorWithPhoneNo;
		visitorWithEmailAndUsername: IVisitorWithEmail;
	};

	describe('[Create Visitor]', () => {
		it('should create a visitor with username and id', (done) => {
			const visitorToBeCreated = visitors.visitorWithUsernameAndId;
			request
				.post(apps(`/public/${appId}/create-visitor`))
				.send({
					visitor: visitorToBeCreated,
				})
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('visitor').and.to.be.an('object');
					const visitor = res.body.visitor as IVisitor;
					expect(visitor).to.have.a.property('id').and.to.be.equal(visitorToBeCreated.id);
					expect(visitor).to.have.a.property('username').and.to.be.equal(visitorToBeCreated.username);
					expect(visitor).to.have.a.property('token').and.to.be.equal(visitorToBeCreated.token);
				})
				.end(done);
		});
		it('should create a visitor with phone number and username', (done) => {
			const visitorToBeCreated = visitors.visitorWithPhoneNoAndUsername;
			request
				.post(apps(`/public/${appId}/create-visitor`))
				.send({
					visitor: visitorToBeCreated,
				})
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('visitor').and.to.be.an('object');
					const visitor = res.body.visitor as IVisitor;
					expect(visitor).to.have.a.property('username').and.to.be.equal(visitorToBeCreated.username);
					expect(visitor).to.have.a.property('token').and.to.be.equal(visitorToBeCreated.token);
					expect(visitor).to.have.a.property('phone').and.to.be.an('array').and.to.have.lengthOf(1);
				})
				.end(done);
		});
		it('should create a visitor with email and username', (done) => {
			const visitorToBeCreated = visitors.visitorWithEmailAndUsername;
			request
				.post(apps(`/public/${appId}/create-visitor`))
				.send({
					visitor: visitorToBeCreated,
				})
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('visitor').and.to.be.an('object');
					const visitor = res.body.visitor as IVisitor;
					expect(visitor).to.have.a.property('username').and.to.be.equal(visitorToBeCreated.username);
					expect(visitor).to.have.a.property('token').and.to.be.equal(visitorToBeCreated.token);
					expect(visitor).to.have.a.property('visitorEmails').and.to.be.an('array').and.to.have.lengthOf(1);
				})
				.end(done);
		});
	});

	describe('[Query Visitor]', () => {
		it('should query a visitor by id', (done) => {
			const visitorToBeQueried = visitors.visitorWithUsernameAndId;
			request
				.get(apps(`/public/${appId}/query-visitor?id=${visitorToBeQueried.id}`))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('visitor').and.to.be.an('object');
					const visitor = res.body.visitor as IVisitor;
					expect(visitor).to.have.a.property('id').and.to.be.equal(visitorToBeQueried.id);
					expect(visitor).to.have.a.property('username').and.to.be.equal(visitorToBeQueried.username);
					expect(visitor).to.have.a.property('token').and.to.be.equal(visitorToBeQueried.token);
				})
				.end(done);
		});
		it('should query a visitor by phone no', (done) => {
			const visitorToBeQueried = visitors.visitorWithPhoneNoAndUsername;
			if (!visitorToBeQueried.phone || !visitorToBeQueried.phone[0] || !visitorToBeQueried.phone[0].phoneNumber) {
				throw new Error('Invalid phone number');
			}
			request
				.get(apps(`/public/${appId}/query-visitor?phone=${encodeURIComponent(visitorToBeQueried.phone[0].phoneNumber)}`))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('visitor').and.to.be.an('object');
					const { visitor } = res.body;
					expect(visitor).to.have.a.property('username').and.to.be.equal(visitorToBeQueried.username);
					expect(visitor).to.have.a.property('token').and.to.be.equal(visitorToBeQueried.token);
					expect(visitor).to.have.a.property('phone').and.to.be.an('array').and.to.have.lengthOf(1);
					expect(visitor.phone[0])
						.to.have.a.property('phoneNumber')
						.and.to.be.equal((visitorToBeQueried as any).phone[0].phoneNumber);
				})
				.end(done);
		});
		it('should query a visitor by visitor token', (done) => {
			const visitorToBeQueried = visitors.visitorWithUsernameAndId;
			request
				.get(apps(`/public/${appId}/query-visitor?token=${visitorToBeQueried.token}`))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('visitor').and.to.be.an('object');
					const visitor = res.body.visitor as IVisitor;
					expect(visitor).to.have.a.property('id').and.to.be.equal(visitorToBeQueried.id);
					expect(visitor).to.have.a.property('username').and.to.be.equal(visitorToBeQueried.username);
					expect(visitor).to.have.a.property('token').and.to.be.equal(visitorToBeQueried.token);
				})
				.end(done);
		});
		it('should query a visitor by visitor email', (done) => {
			const visitorToBeQueried = visitors.visitorWithEmailAndUsername;
			if (!visitorToBeQueried.visitorEmails || !visitorToBeQueried.visitorEmails[0] || !visitorToBeQueried.visitorEmails[0].address) {
				throw new Error('Invalid visitor with no email');
			}
			request
				.get(apps(`/public/${appId}/query-visitor?email=${encodeURIComponent(visitorToBeQueried.visitorEmails[0].address)}`))
				.set(credentials)
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.a.property('visitor').and.to.be.an('object');
					const visitor = res.body.visitor as IVisitor;
					expect(visitor).to.have.a.property('username').and.to.be.equal(visitorToBeQueried.username);
					expect(visitor).to.have.a.property('token').and.to.be.equal(visitorToBeQueried.token);
					expect(visitor).to.have.a.property('visitorEmails').and.to.be.an('array').and.to.have.lengthOf(1);
					expect((visitor as any).visitorEmails[0].address).to.be.equal((visitorToBeQueried as any).visitorEmails[0].address);
				})
				.end(done);
		});
	});
});
