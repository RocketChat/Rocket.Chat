import type { IMessage, IModerationAudit, IReportedMessageInfo } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';

// test for the /moderation.getReports endpoint

describe('[Moderation]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/moderation.getReports]', () => {
		it('should return an array of reports', (done) => {
			request
				.get(api('moderation.getReports'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return an array of reports even requested with count and offset params', (done) => {
			request
				.get(api('moderation.getReports'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return an array of reports even requested with oldest param', (done) => {
			request
				.get(api('moderation.getReports'))
				.set(credentials)
				.query({
					oldest: new Date(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return an array of reports even requested with latest param', (done) => {
			request
				.get(api('moderation.getReports'))
				.set(credentials)
				.query({
					latest: new Date(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				})
				.end(done);
		});
	});

	// test for testing out the moderation.markChecked endpoint

	describe('[/moderation.markChecked]', () => {
		let reportedMessage: IModerationAudit;
		let message: IMessage;

		// post a new message to the channel 'general' by sending a request to chat.postMessage
		before((done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						rid: 'GENERAL',
						msg: 'Sample message 0',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					message = res.body.message;
				})
				.end(done);
		});

		// create a reported message by sending a request to chat.reportMessage
		before((done) => {
			request
				.post(api('chat.reportMessage'))
				.set(credentials)
				.send({
					messageId: message._id,
					description: 'sample report',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		before((done) => {
			request
				.get(api('moderation.getReports'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
					reportedMessage = res.body.reports[0];
				})
				.end(done);
		});

		after((done) => {
			request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should hide reports of a user', (done) => {
			request
				.post(api('moderation.markChecked'))
				.set(credentials)
				.send({
					userId: reportedMessage.userId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should hide reports of a message', (done) => {
			request
				.post(api('moderation.markChecked'))
				.set(credentials)
				.send({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should return an error when the userId && msgId is not provided', (done) => {
			request
				.post(api('moderation.markChecked'))
				.set(credentials)
				.send({
					userId: '',
					msgId: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				})
				.end(done);
		});
	});

	// test for testing out the moderation.reportsByMessage endpoint

	describe('[/moderation.reportsByMessage]', () => {
		let message: IMessage;

		// post a new message to the channel 'general' by sending a request to chat.postMessage
		before((done) => {
			request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'messageId',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').and.to.be.an('object');
					message = res.body.message;
				})
				.end(done);
		});

		// create a reported message by sending a request to chat.reportMessage
		before((done) => {
			request
				.post(api('chat.reportMessage'))
				.set(credentials)
				.send({
					messageId: message._id,
					description: 'sample report',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		after((done) => {
			request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should return the reports for a message', (done) => {
			request
				.get(api('moderation.reportsByMessage'))
				.set(credentials)
				.query({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
					expect(res.body.reports[0]).to.have.property('reporter').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return an error when the msgId is not provided', (done) => {
			request
				.get(api('moderation.reportsByMessage'))
				.set(credentials)
				.query({
					msgId: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				})
				.end(done);
		});
	});

	// test for testing out the moderation.getReportInfo endpoint

	describe('[/moderation.getReportInfo]', () => {
		let message: IMessage;
		let reportedMessage: IReportedMessageInfo;

		// post a new message to the channel 'general' by sending a request to chat.postMessage
		before((done) => {
			request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'messageId',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').and.to.be.an('object');
					message = res.body.message;
				})
				.end(done);
		});

		// create a reported message by sending a request to chat.reportMessage
		before((done) => {
			request
				.post(api('chat.reportMessage'))
				.set(credentials)
				.send({
					messageId: message._id,
					description: 'sample report',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		// get the report information by sending a request to moderation.reportsByMessage
		before((done) => {
			request
				.get(api('moderation.reportsByMessage'))
				.set(credentials)
				.query({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
					reportedMessage = res.body.reports[0];
				})
				.end(done);
		});

		after((done) => {
			request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should return the report information', (done) => {
			request
				.get(api('moderation.getReportInfo'))
				.set(credentials)
				.query({
					reportId: reportedMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('report').and.to.be.an('object');
					expect(res.body.report).to.have.property('_id', reportedMessage._id);
				})
				.end(done);
		});

		it('should return an error when the reportId is not provided', (done) => {
			request
				.get(api('moderation.getReportInfo'))
				.set(credentials)
				.query({
					reportId: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				})
				.end(done);
		});

		it('should return an error when the reportId is invalid', (done) => {
			request
				.get(api('moderation.getReportInfo'))
				.set(credentials)
				.query({
					reportId: 'invalid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				})
				.end(done);
		});

		it('should return an error when the reportId is not found', (done) => {
			request
				.get(api('moderation.getReportInfo'))
				.set(credentials)
				.query({
					reportId: '123456789012345678901234',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				})
				.end(done);
		});
	});

	// test for testing out the moderation.user.getMessageHistory endpoint

	describe('[/moderation.user.getMessageHistory]', () => {
		let message: IMessage;
		let reportedMessage: IReportedMessageInfo;

		// post a new message to the channel 'general' by sending a request to chat.postMessage
		before((done) => {
			request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'messageId',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').and.to.be.an('object');
					message = res.body.message;
				})
				.end(done);
		});

		// create a reported message by sending a request to chat.reportMessage
		before((done) => {
			request
				.post(api('chat.reportMessage'))
				.set(credentials)
				.send({
					messageId: message._id,
					description: 'sample report',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		// get the report information by sending a request to moderation.reportsByMessage
		before((done) => {
			request
				.get(api('moderation.reportsByMessage'))
				.set(credentials)
				.query({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
					reportedMessage = res.body.reports[0];
				})
				.end(done);
		});

		after((done) => {
			request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should return the message history', (done) => {
			request
				.get(api('moderation.user.getMessageHistory'))
				.set(credentials)
				.query({
					userId: reportedMessage.reporter[0]._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return an error when the userId is not provided', (done) => {
			request
				.get(api('moderation.user.getMessageHistory'))
				.set(credentials)
				.query({
					userId: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				})
				.end(done);
		});
	});

	// test for testing out the moderation.user.deleteMessageHistory endpoint

	describe('[/moderation.user.deleteMessageHistory]', () => {
		let message: IMessage;
		let reportedMessage: IReportedMessageInfo;

		// post a new message to the channel 'general' by sending a request to chat.postMessage
		before((done) => {
			request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'messageId',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').and.to.be.an('object');
					message = res.body.message;
				})
				.end(done);
		});

		// create a reported message by sending a request to chat.reportMessage
		before((done) => {
			request
				.post(api('chat.reportMessage'))
				.set(credentials)
				.send({
					messageId: message._id,
					description: 'sample report',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		// get the report information by sending a request to moderation.reportsByMessage
		before((done) => {
			request
				.get(api('moderation.reportsByMessage'))
				.set(credentials)
				.query({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
					reportedMessage = res.body.reports[0];
				})
				.end(done);
		});

		after((done) => {
			request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should delete the message history', (done) => {
			request
				.post(api('moderation.user.deleteMessageHistory'))
				.set(credentials)
				.send({
					userId: reportedMessage.reporter[0]._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should return an error when the userId is not provided', (done) => {
			request
				.post(api('moderation.user.deleteMessageHistory'))
				.set(credentials)
				.send({
					userId: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				})
				.end(done);
		});
	});
});
