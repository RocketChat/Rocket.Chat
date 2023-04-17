import type { IMessage, IModerationAudit, IModerationReport } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';

// test for the /moderation.getReports endpoint

describe('[Moderation]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/moderation.getReports]', () => {
		it('should return an array of reports', async () => {
			await request
				.get(api('moderation.getReports'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				});
		});

		it('should return an array of reports even requested with count and offset params', async () => {
			await request
				.get(api('moderation.getReports'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				});
		});

		it('should return an array of reports even requested with oldest param', async () => {
			await request
				.get(api('moderation.getReports'))
				.set(credentials)
				.query({
					oldest: new Date(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				});
		});

		it('should return an array of reports even requested with latest param', async () => {
			await request
				.get(api('moderation.getReports'))
				.set(credentials)
				.query({
					latest: new Date(),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				});
		});
	});

	// test for testing out the moderation.markChecked endpoint

	describe('[/moderation.markChecked]', () => {
		let reportedMessage: IModerationAudit;
		let message: IMessage;

		// post a new message to the channel 'general' by sending a request to chat.postMessage
		before(async () => {
			await request
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
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					message = res.body.message;
				});
		});

		// create a reported message by sending a request to chat.reportMessage
		before(async () => {
			await request
				.post(api('chat.reportMessage'))
				.set(credentials)
				.send({
					messageId: message._id,
					description: 'sample report',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		before(async () => {
			await request
				.get(api('moderation.getReports'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
					reportedMessage = res.body.reports[0];
				});
		});

		after(async () => {
			await request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should hide reports of a user', async () => {
			await request
				.post(api('moderation.markChecked'))
				.set(credentials)
				.send({
					userId: reportedMessage.userId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should hide reports of a message', async () => {
			await request
				.post(api('moderation.markChecked'))
				.set(credentials)
				.send({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should return an error when the userId && msgId is not provided', async () => {
			await request
				.post(api('moderation.markChecked'))
				.set(credentials)
				.send({
					userId: '',
					msgId: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				});
		});
	});

	// test for testing out the moderation.reportsByMessage endpoint

	describe('[/moderation.reportsByMessage]', () => {
		let message: IMessage;

		// post a new message to the channel 'general' by sending a request to chat.postMessage
		before(async () => {
			await request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'messageId',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').and.to.be.an('object');
					message = res.body.message;
				});
		});

		// create a reported message by sending a request to chat.reportMessage
		before(async () => {
			await request
				.post(api('chat.reportMessage'))
				.set(credentials)
				.send({
					messageId: message._id,
					description: 'sample report',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		after(async () => {
			await request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should return the reports for a message', async () => {
			await request
				.get(api('moderation.reportsByMessage'))
				.set(credentials)
				.query({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
				});
		});

		it('should return an error when the msgId is not provided', async () => {
			await request
				.get(api('moderation.reportsByMessage'))
				.set(credentials)
				.query({
					msgId: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				});
		});
	});

	// test for testing out the moderation.getReportInfo endpoint

	describe('[/moderation.getReportInfo]', () => {
		let message: IMessage;
		let reportedMessage: IModerationReport;

		// post a new message to the channel 'general' by sending a request to chat.postMessage
		before(async () => {
			await request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'messageId',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').and.to.be.an('object');
					message = res.body.message;
				});
		});

		// create a reported message by sending a request to chat.reportMessage
		before(async () => {
			await request
				.post(api('chat.reportMessage'))
				.set(credentials)
				.send({
					messageId: message._id,
					description: 'sample report',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		// get the report information by sending a request to moderation.reportsByMessage
		before(async () => {
			await request
				.get(api('moderation.reportsByMessage'))
				.set(credentials)
				.query({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
					reportedMessage = res.body.reports[0];
				});
		});

		after(async () => {
			await request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should return the report information', async () => {
			await request
				.get(api('moderation.getReportInfo'))
				.set(credentials)
				.query({
					reportId: reportedMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('report').and.to.be.an('object');
					expect(res.body.report).to.have.property('_id', reportedMessage._id);
				});
		});

		it('should return an error when the reportId is not provided', async () => {
			await request
				.get(api('moderation.getReportInfo'))
				.set(credentials)
				.query({
					reportId: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				});
		});

		it('should return an error when the reportId is invalid', async () => {
			await request
				.get(api('moderation.getReportInfo'))
				.set(credentials)
				.query({
					reportId: 'invalid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				});
		});

		it('should return an error when the reportId is not found', async () => {
			await request
				.get(api('moderation.getReportInfo'))
				.set(credentials)
				.query({
					reportId: '123456789012345678901234',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				});
		});
	});

	// test for testing out the moderation.user.getMessageHistory endpoint

	describe('[/moderation.user.getMessageHistory]', () => {
		let message: IMessage;
		let reportedMessage: IModerationReport;

		// post a new message to the channel 'general' by sending a request to chat.postMessage
		before(async () => {
			await request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'messageId',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').and.to.be.an('object');
					message = res.body.message;
				});
		});

		// create a reported message by sending a request to chat.reportMessage
		before(async () => {
			await request
				.post(api('chat.reportMessage'))
				.set(credentials)
				.send({
					messageId: message._id,
					description: 'sample report',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		// get the report information by sending a request to moderation.reportsByMessage
		before(async () => {
			await request
				.get(api('moderation.reportsByMessage'))
				.set(credentials)
				.query({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
					reportedMessage = res.body.reports[0];
				});
		});

		after(async () => {
			await request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'GENERAL',
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should return the message history', async () => {
			await request
				.get(api('moderation.user.getMessageHistory'))
				.set(credentials)
				.query({
					userId: reportedMessage.reportedBy._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
				});
		});

		it('should return an error when the userId is not provided', async () => {
			await request
				.get(api('moderation.user.getMessageHistory'))
				.set(credentials)
				.query({
					userId: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				});
		});
	});

	// test for testing out the moderation.user.deleteMessageHistory endpoint

	describe('[/moderation.user.deleteMessageHistory]', () => {
		let message: IMessage;
		let reportedMessage: IModerationReport;

		// post a new message to the channel 'general' by sending a request to chat.postMessage
		before(async () => {
			await request
				.post(api('chat.postMessage'))
				.set(credentials)
				.send({
					channel: 'general',
					text: 'messageId',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('message').and.to.be.an('object');
					message = res.body.message;
				});
		});

		// create a reported message by sending a request to chat.reportMessage
		before(async () => {
			await request
				.post(api('chat.reportMessage'))
				.set(credentials)
				.send({
					messageId: message._id,
					description: 'sample report',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		// get the report information by sending a request to moderation.reportsByMessage
		before(async () => {
			await request
				.get(api('moderation.reportsByMessage'))
				.set(credentials)
				.query({
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('reports').and.to.be.an('array');
					reportedMessage = res.body.reports[0];
				});
		});

		it('should delete the message history', async () => {
			await request
				.post(api('moderation.user.deleteMessageHistory'))
				.set(credentials)
				.send({
					userId: reportedMessage.reportedBy._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should return an error when the userId is not provided', async () => {
			await request
				.post(api('moderation.user.deleteMessageHistory'))
				.set(credentials)
				.send({
					userId: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').and.to.be.a('string');
				});
		});
	});
});
