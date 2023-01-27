import type { IMessage, IReport } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';

// test for the /moderation.history endpoint

describe('[Moderation]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/moderation.history]', () => {
		it('should return an array of reports', (done) => {
			request
				.get(api('moderation.history'))
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
				.get(api('moderation.history'))
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
				.get(api('moderation.history'))
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
				.get(api('moderation.history'))
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

	// test for testing out the moderation.hide endpoint

	describe('[/moderation.hide]', () => {
		let reportedMessage: IReport;
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
					expect(res.body).to.have.property('report').and.to.be.an('object');
					reportedMessage = res.body.report;
				})
				.end(done);
		});

		after((done) => {
			request
				.post(api('chat.delete'))
				.set(credentials)
				.send({
					roomId: 'general',
					msgId: message._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should hide a report', (done) => {
			request
				.post(api('moderation.hide'))
				.set(credentials)
				.send({
					reportId: reportedMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('report').and.to.be.an('object');
					expect(res.body.report).to.have.property('_hidden', true);
				})
				.end(done);
		});

		it('should return an error when the reportId is not provided', (done) => {
			request
				.post(api('moderation.hide'))
				.set(credentials)
				.send({
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
	});
});
