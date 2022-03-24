import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { expect } from 'chai';

import { getCredentials, request, credentials, api } from '../../data/api-data.js';
import { cleanupApps, installTestApp } from '../../data/apps/helper.js';

const createUniqueId = (): string => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
const createRandomPhoneNumber = (): string => `+1${Math.floor(Math.random() * 10000000000)}`;

describe('Omnichannel - Visitor Tests', function () {
	this.retries(0);
	let appId = '';

	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		appId = (await installTestApp()).id;
	});

	const visitors = {
		visitorWithUsernameAndId: (function (): IVisitor {
			const uniqueId = createUniqueId();
			return {
				id: uniqueId,
				token: uniqueId,
				username: `username-${uniqueId}`,
			} as IVisitor;
		})(),
		visitorWithPhoneNoAndUsername: (function (): IVisitor {
			const phoneNumber = createRandomPhoneNumber();
			return {
				token: createUniqueId(),
				phone: [{ phoneNumber }],
				username: phoneNumber,
			} as IVisitor;
		})(),
	};

	describe('[Create Visitor]', () => {
		it('should create a visitor with username and id', (done) => {
			const visitorToBeCreated = visitors.visitorWithUsernameAndId;
			request
				.post(api(`/public/${appId}/create-visitor`))
				.send({
					visitor: visitorToBeCreated,
				})
				.set(credentials)
				.expect(200)
				.expect((res) => {
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
				.post(api(`/public/${appId}/create-visitor`))
				.send({
					visitor: visitorToBeCreated,
				})
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('visitor').and.to.be.an('object');
					const visitor = res.body.visitor as IVisitor;
					expect(visitor).to.have.a.property('username').and.to.be.equal(visitorToBeCreated.username);
					expect(visitor).to.have.a.property('token').and.to.be.equal(visitorToBeCreated.token);
					expect(visitor).to.have.a.property('phone').and.to.be.an('array').and.to.have.lengthOf(1);
				})
				.end(done);
		});
	});

	describe('[Query Visitor]', () => {
		it('should query a visitor by id', (done) => {
			const visitorToBeQueried = visitors.visitorWithUsernameAndId;
			request
				.get(api(`/public/${appId}/query-visitor?id=${visitorToBeQueried.id}`))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('visitor').and.to.be.an('object');
					const visitor = res.body.visitor as IVisitor;
					expect(visitor).to.have.a.property('id').and.to.be.equal(visitorToBeQueried.id);
					expect(visitor).to.have.a.property('username').and.to.be.equal(visitorToBeQueried.username);
					expect(visitor).to.have.a.property('token').and.to.be.equal(visitorToBeQueried.token);
				})
				.end(done);
		});
	});
});
