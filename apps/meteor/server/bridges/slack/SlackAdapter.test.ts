import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const models = {
	Messages: { findOneById: sinon.stub() },
};
const settingsGet = sinon.stub();
const fileStore = { insert: sinon.stub() };
const parseFileIntoMessageAttachments = sinon.stub();
const slackLogger = { debug: sinon.stub(), error: sinon.stub(), info: sinon.stub() };

const { default: SlackAdapter } = proxyquire.noCallThru().load('./SlackAdapter', {
	'@rocket.chat/core-services': { Message: {}, ClientSafeError: Error },
	'@slack/bolt': { App: class {} },
	'@slack/rtm-api': { RTMClient: class {} },
	'./SlackAPI': { SlackAPI: class {} },
	'./logger': { slackLogger },
	'../../lib/media/file-upload': { FileUpload: { getStore: () => fileStore } },
	'../../lib/messages/deleteMessage': { deleteMessage: sinon.stub() },
	'../../lib/messages/sendMessage': { sendMessage: sinon.stub() },
	'../../lib/messages/updateMessage': { updateMessage: sinon.stub() },
	'../../lib/messaging/reactions/setReaction': { executeSetReaction: sinon.stub() },
	'../../lib/rooms/addUserToRoom': { addUserToRoom: sinon.stub() },
	'../../lib/rooms/archiveRoom': { archiveRoom: sinon.stub() },
	'../../lib/rooms/removeUserFromRoom': { removeUserFromRoom: sinon.stub() },
	'../../lib/rooms/settings': { saveRoomName: sinon.stub(), saveRoomTopic: sinon.stub() },
	'../../lib/rooms/unarchiveRoom': { unarchiveRoom: sinon.stub() },
	'../../lib/utils/getURL': { getWorkspaceURL: sinon.stub() },
	'../../lib/utils/getUserAvatarURL': { getUserAvatarURL: sinon.stub() },
	'../../meteor-methods/messages/sendFileMessage': { parseFileIntoMessageAttachments },
	'../../settings': { settings: { get: settingsGet } },
});

const rocketChannel = { _id: 'room1' };
const rocketUser = { _id: 'user1', username: 'alice' };

const createSlackFile = (id: string, overrides: Record<string, unknown> = {}) => ({
	id,
	name: `${id}.png`,
	mimetype: 'image/png',
	size: 10,
	url_private_download: `https://files.slack.com/files-pri/T1-${id}/download/${id}.png`,
	permalink: `https://team.slack.com/files/U1/${id}/${id}.png`,
	...overrides,
});

const createSlackMessage = (files: Record<string, unknown>[], text = '') => ({
	type: 'message',
	subtype: 'file_share',
	channel: 'C1',
	user: 'U1',
	ts: '1700000000.000100',
	text,
	files,
});

describe('SlackAdapter', () => {
	describe('processFileShare', () => {
		let adapter: any;
		let rocket: Record<string, sinon.SinonStub>;
		let downloadFile: sinon.SinonStub;

		before(() => {
			mockModel('Messages', models.Messages);
		});

		beforeEach(() => {
			for (const stub of [models.Messages.findOneById, settingsGet, fileStore.insert, parseFileIntoMessageAttachments, slackLogger.error]) {
				stub.reset();
			}
			settingsGet.withArgs('SlackBridge_FileUpload_Enabled').returns(true);
			settingsGet.withArgs('FileUpload_MaxFileSize').returns(100);
			models.Messages.findOneById.resolves(null);
			fileStore.insert.callsFake(async ({ name }) => ({ _id: `upload-${name}`, name }));
			parseFileIntoMessageAttachments.callsFake(async (upload) => ({
				files: [{ _id: upload._id, name: upload.name }],
				attachments: [{ title: upload.name }],
			}));

			rocket = {
				getChannel: sinon.stub().resolves(rocketChannel),
				getUser: sinon.stub().resolves(rocketUser),
				createRocketID: sinon.stub().callsFake((channel: string, ts: string) => `slack-${channel}-${ts.replace(/\./g, '-')}`),
				createAndSaveMessage: sinon.stub().resolves(),
			};
			downloadFile = sinon.stub().resolves({ content: Buffer.from('png-bytes'), contentType: 'image/png' });

			adapter = new SlackAdapter({});
			adapter.setRocket(rocket);
			adapter.slackAPI = { downloadFile };
		});

		const savedMessage = () => {
			const [, , slackMessage, msgDataDefaults] = rocket.createAndSaveMessage.firstCall.args;
			return { slackMessage, msgDataDefaults };
		};

		it('should store every file and keep the text as the caption', async () => {
			await adapter.processFileShare(createSlackMessage([createSlackFile('F1'), createSlackFile('F2')], 'look at these'));

			expect(downloadFile.args.map(([url]) => url)).to.deep.equal([
				'https://files.slack.com/files-pri/T1-F1/download/F1.png',
				'https://files.slack.com/files-pri/T1-F2/download/F2.png',
			]);
			expect(fileStore.insert.firstCall.args[0]).to.deep.equal({
				name: 'F1.png',
				size: 9,
				type: 'image/png',
				rid: 'room1',
				userId: 'user1',
			});
			expect(parseFileIntoMessageAttachments.firstCall.args.slice(1)).to.deep.equal(['room1', rocketUser]);

			const { slackMessage, msgDataDefaults } = savedMessage();
			expect(slackMessage.text).to.equal('look at these');
			expect(slackMessage.subtype).to.be.undefined;
			expect(msgDataDefaults).to.deep.include({
				_id: 'slack-C1-1700000000-000100',
				updatedBySlack: true,
				groupable: false,
				file: { _id: 'upload-F1.png', name: 'F1.png' },
				files: [
					{ _id: 'upload-F1.png', name: 'F1.png' },
					{ _id: 'upload-F2.png', name: 'F2.png' },
				],
				attachments: [{ title: 'F1.png' }, { title: 'F2.png' }],
			});
		});

		it('should link a file that could not be downloaded and still attach the others', async () => {
			downloadFile.onFirstCall().rejects(new Error('Unexpected response status 404'));

			await adapter.processFileShare(createSlackMessage([createSlackFile('F1'), createSlackFile('F2')], 'caption'));

			const { slackMessage, msgDataDefaults } = savedMessage();
			expect(slackMessage.text).to.equal('caption\nhttps://team.slack.com/files/U1/F1/F1.png');
			expect(msgDataDefaults.files).to.deep.equal([{ _id: 'upload-F2.png', name: 'F2.png' }]);
			expect(slackLogger.error.calledOnce).to.be.true;
		});

		it('should not repeat a link the caption already contains', async () => {
			downloadFile.rejects(new Error('Unexpected response status 404'));

			await adapter.processFileShare(createSlackMessage([createSlackFile('F1')], 'see <https://team.slack.com/files/U1/F1/F1.png>'));

			const { slackMessage, msgDataDefaults } = savedMessage();
			expect(slackMessage.text).to.equal('see <https://team.slack.com/files/U1/F1/F1.png>');
			expect(msgDataDefaults).to.not.have.property('files');
		});

		it('should link a file Slack offers no download for', async () => {
			await adapter.processFileShare(
				createSlackMessage([createSlackFile('F1', { url_private_download: undefined, mode: 'hidden_by_limit' })]),
			);

			expect(downloadFile.called).to.be.false;
			expect(savedMessage().slackMessage.text).to.equal('https://team.slack.com/files/U1/F1/F1.png');
		});

		it('should not download a file larger than the upload size limit', async () => {
			await adapter.processFileShare(createSlackMessage([createSlackFile('F1', { size: 101 })]));

			expect(downloadFile.called).to.be.false;
			expect(fileStore.insert.called).to.be.false;
			expect(savedMessage().slackMessage.text).to.equal('https://team.slack.com/files/U1/F1/F1.png');
		});

		it('should cap the download at the upload size limit', async () => {
			await adapter.processFileShare(createSlackMessage([createSlackFile('F1')]));

			expect(downloadFile.firstCall.args[1]).to.equal(100);
		});

		// Slack answers with its sign-in page when the app lacks the files:read scope
		it('should not store a web page returned for a file that is not one', async () => {
			downloadFile.resolves({ content: Buffer.from('<html></html>'), contentType: 'text/html; charset=utf-8' });

			await adapter.processFileShare(createSlackMessage([createSlackFile('F1')]));

			expect(fileStore.insert.called).to.be.false;
			expect(savedMessage().slackMessage.text).to.equal('https://team.slack.com/files/U1/F1/F1.png');
		});

		it('should store an HTML file shared on Slack', async () => {
			downloadFile.resolves({ content: Buffer.from('<html></html>'), contentType: 'text/html' });

			await adapter.processFileShare(createSlackMessage([createSlackFile('F1', { name: 'page.html', mimetype: 'text/html' })]));

			expect(fileStore.insert.calledOnce).to.be.true;
		});

		it('should not save the message when file uploads from Slack are disabled', async () => {
			settingsGet.withArgs('SlackBridge_FileUpload_Enabled').returns(false);

			await adapter.processFileShare(createSlackMessage([createSlackFile('F1')]));

			expect(downloadFile.called).to.be.false;
			expect(rocket.createAndSaveMessage.called).to.be.false;
		});

		it('should not import the files again for a message already saved', async () => {
			models.Messages.findOneById.resolves({ _id: 'slack-C1-1700000000-000100' });

			await adapter.processFileShare(createSlackMessage([createSlackFile('F1')]));

			expect(downloadFile.called).to.be.false;
			expect(rocket.createAndSaveMessage.called).to.be.false;
		});
	});
});
