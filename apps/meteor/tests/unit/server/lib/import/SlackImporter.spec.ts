import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const addMessageStub = sinon.stub().resolves();
const settingsStub = { get: sinon.stub() };

const { SlackImporter } = proxyquire.noCallThru().load('../../../../../server/lib/import/slack/SlackImporter', {
	'@rocket.chat/models': {
		'Messages': { find: sinon.stub().returns({ toArray: () => [] }) },
		'Settings': { findOneById: sinon.stub().resolves(null) },
		'ImportData': {},
		'@global': true,
	},
	'..': {
		Importer: class MockImporter {
			logger = { debug: sinon.stub(), error: sinon.stub(), info: sinon.stub(), warn: sinon.stub() };

			progress = { count: { total: 0 } };

			converter = {
				addMessage: addMessageStub,
				addUser: sinon.stub().resolves(),
				addChannel: sinon.stub().resolves(),
			};

			_useUpsert = false;

			reportProgress() {
				// no-op
			}

			async updateProgress() {
				// no-op
			}

			async updateRecord() {
				// no-op
			}

			getProgress() {
				return this.progress;
			}
		},
		ProgressStep: {
			PREPARING_STARTED: 'preparing_started',
			IMPORTING_USERS: 'importing_users',
			IMPORTING_CHANNELS: 'importing_channels',
			IMPORTING_MESSAGES: 'importing_messages',
			DONE: 'done',
			ERROR: 'error',
		},
		ImporterWebsocket: { progressUpdated: sinon.stub() },
	},
	'../../notifyListener': { notifyOnSettingChanged: sinon.stub() },
	'../../../../app/mentions/lib/MentionsParser': {
		MentionsParser: class {
			getUserMentions() {
				return [];
			}

			getChannelMentions() {
				return [];
			}
		},
	},
	'../../../settings': { settings: settingsStub },
	'../../utils/getUserAvatarURL': { getUserAvatarURL: sinon.stub().returns('/avatar/user') },
});

describe('SlackImporter', () => {
	let importer: any;

	beforeEach(() => {
		addMessageStub.reset();
		settingsStub.get.reset();

		const info = { key: 'slack', name: 'Slack' };
		const importRecord = { _id: 'test-import' };
		importer = new SlackImporter(info, importRecord, {});
	});

	describe('processMessageSubType - file_share', () => {
		it('should create hidden file message with empty msg for file_share subtype', async () => {
			const message = {
				type: 'message',
				subtype: 'file_share',
				ts: '1234567890.000001',
				user: 'U12345',
				file: {
					id: 'F12345',
					name: 'test.png',
					url_private_download: 'https://files.slack.com/files/F12345/test.png?token=xoxe-123',
					size: 1024,
					is_external: false,
				},
			};

			const slackChannelId = 'C12345';
			const newMessage = {
				_id: 'slack-C12345-1234567890-000001',
				rid: slackChannelId,
				ts: new Date(1234567890000),
				msg: '',
				u: { _id: 'U12345' },
			};

			await importer.processMessageSubType(message, slackChannelId, newMessage, {});

			expect(addMessageStub.calledOnce).to.be.true;

			const fileMessage = addMessageStub.firstCall.args[0];
			expect(fileMessage._hidden).to.equal(true);
			expect(fileMessage.msg).to.equal('');
			expect(fileMessage._importFile).to.exist;
			expect(fileMessage._importFile.downloadUrl).to.equal('https://files.slack.com/files/F12345/test.png?token=xoxe-123');
		});

		it('should not create file message if file has no download URL', async () => {
			const message = {
				type: 'message',
				subtype: 'file_share',
				ts: '1234567890.000001',
				user: 'U12345',
				file: {
					id: 'F12345',
					name: 'test.png',
					size: 1024,
				},
			};

			const slackChannelId = 'C12345';
			const newMessage = {
				_id: 'slack-C12345-1234567890-000001',
				rid: slackChannelId,
				ts: new Date(1234567890000),
				msg: '',
				u: { _id: 'U12345' },
			};

			await importer.processMessageSubType(message, slackChannelId, newMessage, {});

			expect(addMessageStub.called).to.be.false;
		});

		it('should include thread message id if file is shared in a thread', async () => {
			const message = {
				type: 'message',
				subtype: 'file_share',
				ts: '1234567890.000002',
				thread_ts: '1234567890.000001',
				user: 'U12345',
				file: {
					id: 'F12345',
					name: 'test.png',
					url_private_download: 'https://files.slack.com/files/F12345/test.png',
					size: 1024,
				},
			};

			const slackChannelId = 'C12345';
			const newMessage = {
				_id: 'slack-C12345-1234567890-000002',
				rid: slackChannelId,
				ts: new Date(1234567890000),
				msg: '',
				u: { _id: 'U12345' },
			};

			await importer.processMessageSubType(message, slackChannelId, newMessage, {});

			expect(addMessageStub.calledOnce).to.be.true;

			const fileMessage = addMessageStub.firstCall.args[0];
			expect(fileMessage.tmid).to.equal('slack-C12345-1234567890-000001');
			expect(fileMessage._hidden).to.equal(true);
		});
	});

	describe('prepareMessageObject - messages with files', () => {
		it('should create hidden file messages for messages with files array', async () => {
			const message = {
				type: 'message',
				ts: '1234567890.000001',
				user: 'U12345',
				text: 'Check out these files',
				files: [
					{
						id: 'F12345',
						name: 'image1.png',
						url_private_download: 'https://files.slack.com/files/F12345/image1.png',
						size: 1024,
					},
					{
						id: 'F12346',
						name: 'image2.png',
						url_private_download: 'https://files.slack.com/files/F12346/image2.png',
						size: 2048,
					},
				],
			};

			const slackChannelId = 'C12345';

			await importer.prepareMessageObject(message, {}, slackChannelId);

			const fileMessages = addMessageStub.getCalls().filter((call: any) => call.args[0]._importFile);
			expect(fileMessages.length).to.equal(2);

			fileMessages.forEach((call: any) => {
				const fileMessage = call.args[0];
				expect(fileMessage._hidden).to.equal(true);
				expect(fileMessage.msg).to.equal('');
				expect(fileMessage._importFile).to.exist;
			});
		});

		it('should create unique file message IDs for multiple files', async () => {
			const message = {
				type: 'message',
				ts: '1234567890.000001',
				user: 'U12345',
				text: 'Multiple files',
				files: [
					{ id: 'F1', name: 'file1.png', url_private_download: 'https://files.slack.com/F1', size: 100 },
					{ id: 'F2', name: 'file2.png', url_private_download: 'https://files.slack.com/F2', size: 200 },
				],
			};

			await importer.prepareMessageObject(message, {}, 'C12345');

			const fileMessages = addMessageStub.getCalls().filter((call: any) => call.args[0]._importFile);
			const ids = fileMessages.map((call: any) => call.args[0]._id);

			expect(ids[0]).to.include('-file1');
			expect(ids[1]).to.include('-file2');
			expect(ids[0]).to.not.equal(ids[1]);
		});
	});

	describe('convertSlackFileToPendingFile', () => {
		it('should convert Slack file to pending file format', () => {
			const slackFile = {
				id: 'F12345',
				name: 'document.pdf',
				url_private_download: 'https://files.slack.com/files/F12345/document.pdf?token=xoxe-abc',
				size: 4096,
				is_external: false,
				mimetype: 'application/pdf',
			};

			const pendingFile = importer.convertSlackFileToPendingFile(slackFile);

			expect(pendingFile.id).to.equal('F12345');
			expect(pendingFile.name).to.equal('document.pdf');
			expect(pendingFile.downloadUrl).to.equal('https://files.slack.com/files/F12345/document.pdf?token=xoxe-abc');
			expect(pendingFile.size).to.equal(4096);
			expect(pendingFile.external).to.equal(false);
			expect(pendingFile.source).to.equal('slack');
			expect(pendingFile.original).to.deep.include(slackFile);
		});

		it('should handle external files', () => {
			const slackFile = {
				id: 'F99999',
				name: 'external.pdf',
				url_private_download: 'https://external.com/file.pdf',
				size: 1000,
				is_external: true,
			};

			const pendingFile = importer.convertSlackFileToPendingFile(slackFile);

			expect(pendingFile.external).to.equal(true);
		});
	});

	describe('makeSlackMessageId', () => {
		it('should generate base message ID without file index', () => {
			const id = importer.makeSlackMessageId('C12345', '1234567890.000001');

			expect(id).to.equal('slack-C12345-1234567890-000001');
		});

		it('should generate message ID with file index', () => {
			const id = importer.makeSlackMessageId('C12345', '1234567890.000001', '1');

			expect(id).to.equal('slack-C12345-1234567890-000001-file1');
		});

		it('should replace dots with dashes in timestamp', () => {
			const id = importer.makeSlackMessageId('CHANNEL', '123.456.789');

			expect(id).to.equal('slack-CHANNEL-123-456-789');
		});
	});
});
