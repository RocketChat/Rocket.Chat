/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import {getCredentials, api, login, request, credentials, directMessage, log } from '../../data/api-data.js';
import {adminEmail, password} from '../../data/user.js';
import supertest from 'supertest';

describe('[Direct Messages]', function() {
	this.retries(0);

	before(done => getCredentials(done));

	it('/chat.postMessage', (done) => {
		request.post(api('chat.postMessage'))
			.set(credentials)
			.send({
				channel: 'rocket.cat',
				text: 'This message was sent using the API'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.deep.property('message.msg', 'This message was sent using the API');
				expect(res.body).to.have.deep.property('message.rid');
				directMessage._id = res.body.message.rid;
			})
			.end(done);
	});

	it('/im.setTopic', (done) => {
		request.post(api('im.setTopic'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
				topic: 'a direct message with rocket.cat'
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
				userId: 'rocket.cat'
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

	it('/im.close', (done) => {
		request.post(api('im.close'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/im.open', (done) => {
		request.post(api('im.open'))
			.set(credentials)
			.send({
				roomId: directMessage._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});
});
