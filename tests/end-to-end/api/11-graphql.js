/* eslint-env mocha */

const supertest = require('supertest');
const request = supertest('http://localhost:3000');

import {adminUsername, adminPassword, adminEmail} from '../../data/user.js';

const user = {username: adminUsername, password: adminPassword, email: adminEmail, accessToken: null};
const channel = {};
const message = {content: 'Test Message GraphQL', modifiedContent: 'Test Message GraphQL Modified'};

const { expect } = require('chai');

const credentials = {
	['X-Auth-Token']: undefined,
	['X-User-Id']: undefined
};

const login = {
	user: adminUsername,
	password: adminPassword
};

describe('GraphQL Tests', function() {
	this.retries(0);

	before((done) => {
		request.post('/api/v1/login')
			.send(login)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				credentials['X-Auth-Token'] = res.body.data.authToken;
				credentials['X-User-Id'] = res.body.data.userId;
			})
			.end(done);
	});

	before((done) => {
		request.get('/api/graphql')
			.expect(400)
			.end(done);
	});

	before((done) => {
		request.post('/api/v1/settings/Graphql_Enabled')
			.set(credentials)
			.send({'value': true})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	after((done) => {
		request.post('/api/v1/settings/Graphql_Enabled')
			.set(credentials)
			.send({'value': false})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('Is able to login with username and password', (done) => {
		const query = `
			mutation login{
				loginWithPassword(user: {username: "${ user.username }"}, password: "${ user.password }") {
					user {
						username,
						email
					},
					tokens {
						accessToken
					}
				}
			}`;
		request.post('/api/graphql')
			.send({
				query
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('data');
				expect(res.body).to.not.have.property('errors');
				const data = res.body.data.loginWithPassword;
				expect(data).to.have.property('user');
				expect(data).to.have.property('tokens');
				user.accessToken = data.tokens.accessToken;
				expect(data.user).to.have.property('username', user.username);
				expect(data.user).to.have.property('email', user.email);

			})
			.end(done);
	});

	it('Is able to login with email and password', (done) => {
		const query = `
			mutation login {
				loginWithPassword(user: {email: "${ user.email }"}, password: "${ user.password }") {
					user {
						username,
						email,
						id
					},
					tokens {
						accessToken
					}
				}
			}`;
		request.post('/api/graphql')
			.send({
				query
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('data');
				expect(res.body).to.not.have.property('errors');
				const data = res.body.data.loginWithPassword;
				expect(data).to.have.property('user');
				expect(data).to.have.property('tokens');
				user.accessToken = data.tokens.accessToken;
				expect(data.user).to.have.property('username', user.username);
				expect(data.user).to.have.property('email', user.email);
			})
			.end(done);
	});

	it('Fails when trying to login with wrong password', (done) => {
		const query = `
			mutation login {
				loginWithPassword(user: {username: "${ user.username }"}, password: "not!${ user.password }") {
					user {
						username
					},
					tokens {
						accessToken
					}
				}
			}`;
		request.post('/api/graphql')
			.send({
				query
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('data');
				expect(res.body).to.have.property('errors');
				expect(res.body.data).to.have.property('loginWithPassword', null);
				expect(res.body.errors[0]).to.have.property('message', 'Incorrect password');
			})
			.end(done);
	});

	it('Is able to get user data (/me)', (done) => {
		const query = `
			{
				me {
					username,
					name,
					email,
					channels {
						id,
						name
					},
					directMessages {
						id,
						name
					}
				}
			}`;
		request.post('/api/graphql')
			.set('Authorization', user.accessToken)
			.send({
				query
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('data');
				expect(res.body).to.not.have.property('errors');
				const me = res.body.data.me;
				expect(me).to.have.property('username', user.username);
				expect(me).to.have.property('email', user.email);
				expect(me.channels).to.be.an('array');
				expect(me.channels[0]).to.have.property('id');
				channel.id = me.channels[0].id;
			})
			.end(done);
	});

	it('Is able to send messages to channel', (done) => {
		const query = `
			mutation sendMessage{
				sendMessage(channelId: "${ channel.id }", content: "${ message.content }") {
					id,
					author {
						username,
						name
					},
					content,
					channel {
						name,
						id
					},
					reactions {
						username,
						icon
					}
				}
			}`;
		request.post('/api/graphql')
			.set('Authorization', user.accessToken)
			.send({
				query
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('data');
				expect(res.body).to.not.have.property('errors');
				const data = res.body.data.sendMessage;
				expect(data).to.have.property('id');
				message.id = data.id;
				expect(data).to.have.property('author');
				expect(data.author).to.have.property('username', user.username);
				expect(data).to.have.property('content', message.content);
				expect(data).to.have.property('channel');
				expect(data.channel).to.have.property('id', channel.id);
				expect(data).to.have.property('reactions', null);
			})
			.end(done);
	});

	it('Is able to edit messages', (done) => {
		const query = `
			mutation editMessage {
				editMessage(id: {messageId: "${ message.id }", channelId: "${ channel.id }"}, content: "${ message.modifiedContent }") {
					id,
					content,
					author {
						username
					},
					channel {
						id,
						name
					}
				}
			}`;
		request.post('/api/graphql')
			.set('Authorization', user.accessToken)
			.send({
				query
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('data');
				expect(res.body).to.not.have.property('errors');
				const data = res.body.data.editMessage;
				expect(data).to.have.property('id');
				expect(data).to.have.property('author');
				expect(data.author).to.have.property('username', user.username);
				expect(data).to.have.property('content', message.modifiedContent);
				expect(data).to.have.property('channel');
				expect(data.channel).to.have.property('id', channel.id);
			})
			.end(done);
	});

	it('Can read messages from channel', (done) => {
		const query = `
			{
				messages (channelId: "${ channel.id }") {
					channel {
						id,
						name
					},
					messagesArray {
						id,
						author {
							username
						},
						content
					}
				}
			}`;
		request.post('/api/graphql')
			.set('Authorization', user.accessToken)
			.send({
				query
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('data');
				expect(res.body).to.not.have.property('errors');
				const data = res.body.data.messages;
				expect(data).to.have.property('channel');
				expect(data.channel).to.have.property('id', channel.id);

				expect(data).to.have.property('messagesArray');
				expect(data.messagesArray[0]).to.have.property('id', message.id);
				expect(data.messagesArray[0]).to.have.property('author');
				expect(data.messagesArray[0].author).to.have.property('username', user.username);
				expect(data.messagesArray[0]).to.have.property('content', message.modifiedContent);
			})
			.end(done);
	});
	it('Is able to delete messages', (done) => {
		const query = `
			mutation deleteMessage {
				deleteMessage(id: {messageId: "${ message.id }", channelId: "${ channel.id }"}) {
					id,
					author {
						username
					}
				}
			}`;
		request.post('/api/graphql')
			.set('Authorization', user.accessToken)
			.send({
				query
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('data');
				expect(res.body).to.not.have.property('errors');
				const data = res.body.data.deleteMessage;
				expect(data).to.have.property('id', message.id);
				expect(data).to.have.property('author');
				expect(data.author).to.have.property('username', user.username);
			})
			.end(done);
	});
});
