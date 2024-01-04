import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { sendSimpleMessage } from '../../data/chat.helper.js';
import { createRoom } from '../../data/rooms.helper.js';

describe('[Commands]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/commands.get]', () => {
		it('should return an error when call the endpoint without "command" required parameter', (done) => {
			request
				.get(api('commands.get'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('The query param "command" must be provided.');
				})
				.end(done);
		});
		it('should return an error when call the endpoint with an invalid command', (done) => {
			request
				.get(api('commands.get'))
				.set(credentials)
				.query({
					command: 'invalid-command',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('There is no command in the system by the name of: invalid-command');
				})
				.end(done);
		});
		it('should return success when parameters are correct', (done) => {
			request
				.get(api('commands.get'))
				.set(credentials)
				.query({
					command: 'help',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('command');
					expect(res.body.command).to.have.property('command');
					expect(res.body.command).to.have.property('description');
					expect(res.body.command).to.have.property('clientOnly');
					expect(res.body.command).to.have.property('providesPreview');
				})
				.end(done);
		});
	});

	describe('[/commands.list]', () => {
		it('should return a list of commands', (done) => {
			request
				.get(api('commands.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('commands').and.to.be.an('array');
				})
				.end(done);
		});
		it('should return a list of commands even requested with count and offset params', (done) => {
			request
				.get(api('commands.list'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('commands').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('[/commands.run]', () => {
		let testChannel;
		let threadMessage;

		before((done) => {
			createRoom({ type: 'c', name: `channel.test.commands.${Date.now()}` }).end((err, res) => {
				testChannel = res.body.channel;
				sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Message to create thread',
				}).end((err, message) => {
					sendSimpleMessage({
						roomId: testChannel._id,
						text: 'Thread Message',
						tmid: message.body.message._id,
					}).end((err, res) => {
						threadMessage = res.body.message;
						done();
					});
				});
			});
		});

		it('should return an error when call the endpoint without "command" required parameter', (done) => {
			request
				.post(api('commands.run'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('You must provide a command to run.');
				})
				.end(done);
		});
		it('should return an error when call the endpoint with the param "params" and it is not a string', (done) => {
			request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'help',
					params: true,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('The parameters for the command must be a single string.');
				})
				.end(done);
		});
		it('should return an error when call the endpoint without "roomId" required parameter', (done) => {
			request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'help',
					params: 'params',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal("The room's id where to execute this command must be provided and be a string.");
				})
				.end(done);
		});
		it('should return an error when call the endpoint with the param "tmid" and it is not a string', (done) => {
			request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'help',
					params: 'params',
					roomId: 'GENERAL',
					tmid: true,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('The tmid parameter when provided must be a string.');
				})
				.end(done);
		});
		it('should return an error when call the endpoint with the invalid "command" param', (done) => {
			request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'invalid-command',
					params: 'params',
					roomId: 'GENERAL',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('The command provided does not exist (or is disabled).');
				})
				.end(done);
		});
		it('should return an error when call the endpoint with an invalid thread id', (done) => {
			request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'tableflip',
					params: 'params',
					roomId: 'GENERAL',
					tmid: 'invalid-thread',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('Invalid thread.');
				})
				.end(done);
		});
		it('should return an error when call the endpoint with a valid thread id of wrong channel', (done) => {
			request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'tableflip',
					params: 'params',
					roomId: 'GENERAL',
					tmid: threadMessage.tmid,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('Invalid thread.');
				})
				.end(done);
		});
		it('should return success when parameters are correct', (done) => {
			request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'tableflip',
					params: 'params',
					roomId: threadMessage.rid,
					tmid: threadMessage.tmid,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});
});
