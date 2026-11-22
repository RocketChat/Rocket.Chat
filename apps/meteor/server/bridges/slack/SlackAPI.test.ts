import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const serverFetch = sinon.stub();

const { SlackAPI } = proxyquire.noCallThru().load('./SlackAPI', {
	'@rocket.chat/server-fetch': { serverFetch },
});

const createResponse = (status: number, contentType: string, body = 'file-bytes') => ({
	ok: status >= 200 && status < 300,
	status,
	headers: new Map([['content-type', contentType]]),
	buffer: async () => Buffer.from(body),
});

describe('SlackAPI', () => {
	describe('downloadFile', () => {
		beforeEach(() => {
			serverFetch.reset();
		});

		it('should download the file with the token', async () => {
			serverFetch.resolves(createResponse(200, 'image/png'));

			const result = await new SlackAPI('xoxb-token').downloadFile('https://files.slack.com/files-pri/T1-F1/download/a.png', 100);

			expect(result.content.toString()).to.equal('file-bytes');
			expect(result.contentType).to.equal('image/png');
			const [url, options] = serverFetch.firstCall.args;
			expect(url).to.equal('https://files.slack.com/files-pri/T1-F1/download/a.png');
			expect(options).to.deep.equal({ headers: { Authorization: 'Bearer xoxb-token' }, size: 100 });
		});

		it('should not limit the body size when the limit is disabled', async () => {
			serverFetch.resolves(createResponse(200, 'image/png'));

			await new SlackAPI('xoxb-token').downloadFile('https://files.slack-files.com/F1/a.png', -1);

			expect(serverFetch.firstCall.args[1]).to.not.have.property('size');
		});

		for (const fileUrl of [
			'http://files.slack.com/files-pri/T1-F1/download/a.png',
			'https://files.slack.com.example.com/a.png',
			'https://example.com/slack.com/a.png',
			'https://notslack.com/a.png',
		]) {
			it(`should not send the token to ${fileUrl}`, async () => {
				await expect(new SlackAPI('xoxb-token').downloadFile(fileUrl, 100)).to.be.rejectedWith('error-invalid-slack-file-url');
				expect(serverFetch.called).to.be.false;
			});
		}

		it('should reject an error response', async () => {
			serverFetch.resolves(createResponse(404, 'text/plain'));

			await expect(new SlackAPI('xoxb-token').downloadFile('https://files.slack.com/a.png', 100)).to.be.rejectedWith(
				'Unexpected response status 404',
			);
		});
	});
});
