/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import { getCredentials, api, login, request, credentials, directMessage, log, apiUsername, apiEmail } from '../../data/api-data.js';
import { adminEmail, password } from '../../data/user.js';
import supertest from 'supertest';

describe('[Direct Messages]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	it('/chat.postMessage', (done) => {
		request.post(api('chat.postMessage'))
			.set(credentials)
			.send({
				channel: 'rocket.cat',
				text: 'This message was sent using the API',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('message.msg', 'This message was sent using the API');
				expect(res.body).to.have.nested.property('message.rid');
				directMessage._id = res.body.message.rid;
			})
			.end(done);
	});

	it('/im.setTopic', (done) => {
		request.post(api('im.setTopic'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
				topic: 'a direct message with rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/im.history', (done) => {
		request.get(api('im.history'))
			.set(credentials)
			.query({
				roomId: directMessage._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('messages');
			})
			.end(done);
	});

	it('/im.list', (done) => {
		request.get(api('im.list'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count');
				expect(res.body).to.have.property('total');
			})
			.end(done);
	});

	it('/im.list.everyone', (done) => {
		request.get(api('im.list.everyone'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count');
				expect(res.body).to.have.property('total');
			})
			.end(done);
	});

	it('/im.open', (done) => {
		request.post(api('im.open'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/im.counters', (done) => {
		request.get(api('im.counters'))
			.set(credentials)
			.query({
				roomId: directMessage._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('joined', true);
				expect(res.body).to.have.property('members');
				expect(res.body).to.have.property('unreads');
				expect(res.body).to.have.property('unreadsFrom');
				expect(res.body).to.have.property('msgs');
				expect(res.body).to.have.property('latest');
				expect(res.body).to.have.property('userMentions');
			})
			.end(done);
	});

	it('/im.close', (done) => {
		request.post(api('im.close'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	describe('fname property', () => {
		const username = `fname_${ apiUsername }`;
		const name = `Name fname_${ apiUsername }`;
		const updatedName = `Updated Name fname_${ apiUsername }`;
		const email = `fname_${ apiEmail }`;
		let userId;
		let directMessageId;

		before((done) => {
			request.post(api('users.create'))
				.set(credentials)
				.send({
					email,
					name,
					username,
					password,
					active: true,
					roles: ['user'],
					joinDefaultChannels: true,
					verified: true,
				})
				.expect((res) => {
					userId = res.body.user._id;
				})
				.end(done);
		});

		before((done) => {
			request.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: `@${ username }`,
					text: 'This message was sent using the API',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message.msg', 'This message was sent using the API');
					expect(res.body).to.have.nested.property('message.rid');
					directMessageId = res.body.message.rid;
				})
				.end(done);
		});

		it('should have fname property', (done) => {
			request.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({
					roomId: directMessageId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.have.property('name', username);
					expect(res.body.subscription).to.have.property('fname', name);
				})
				.end(done);
		});

		it('should update user\'s name', (done) => {
			request.post(api('users.update'))
				.set(credentials)
				.send({
					userId,
					data: {
						name: updatedName,
					},
				})
				.expect((res) => {
					expect(res.body.user).to.have.property('name', updatedName);
				})
				.end(done);
		});

		it('should have fname property updated', (done) => {
			request.get(api('subscriptions.getOne'))
				.set(credentials)
				.query({
					roomId: directMessageId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.subscription).to.have.property('name', username);
					expect(res.body.subscription).to.have.property('fname', updatedName);
				})
				.end(done);
		});
	});
	describe('/im.members', () => {
		it('should return and array with two members', (done) => {
			request.get(api('im.members'))
				.set(credentials)
				.query({
					roomId: directMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count').and.to.be.equal(2);
					expect(res.body).to.have.property('offset').and.to.be.equal(0);
					expect(res.body).to.have.property('total').and.to.be.equal(2);
					expect(res.body).to.have.property('members').and.to.have.lengthOf(2);
				})
				.end(done);
		});
	});
});
