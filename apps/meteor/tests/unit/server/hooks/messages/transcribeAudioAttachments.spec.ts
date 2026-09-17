import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const transcribeMessageAttachment = sinon.stub();
const settingsGet = sinon.stub();
const logError = sinon.stub();

const { transcribeAudioAttachments } = p.noCallThru().load('../../../../../server/hooks/messages/transcribeAudioAttachments.ts', {
	'@rocket.chat/core-services': {
		Transcription: { transcribeMessageAttachment },
	},
	'@rocket.chat/core-typings': {
		isE2EEMessage: (message: { t?: string }) => message.t === 'e2e',
		isFileAudioAttachment: (attachment: { type?: string; audio_url?: string }) =>
			attachment?.type === 'file' && typeof attachment.audio_url === 'string',
	},
	'meteor/meteor': { Meteor: { startup: sinon.stub() } },
	'../../lib/callbacks': {
		callbacks: { add: sinon.stub(), remove: sinon.stub(), priority: { LOW: 'low' } },
	},
	'../../lib/logger/system': {
		SystemLogger: { error: logError },
	},
	'../../settings': {
		settings: {
			get: settingsGet,
			watch: sinon.stub(),
		},
	},
});

describe('transcribeAudioAttachments', () => {
	beforeEach(() => {
		transcribeMessageAttachment.reset();
		transcribeMessageAttachment.resolves();
		logError.reset();
		settingsGet.reset();
		settingsGet.returns('');
		settingsGet.withArgs('AI_Voice_Transcription_Enabled').returns(true);
	});

	it('enqueues pending audio attachments', () => {
		settingsGet.withArgs('AI_Voice_Transcription_Language').returns('');

		const message = {
			_id: 'mid-1',
			rid: 'rid-1',
			attachments: [
				{
					type: 'file',
					audio_url: '/file/1',
					audio_type: 'audio/mpeg',
					fileId: 'file-1',
					transcription: { status: 'pending' },
				},
			],
		};

		transcribeAudioAttachments(message, { room: { _id: 'rid-1' }, user: { language: 'pt-BR' } });

		expect(
			transcribeMessageAttachment.calledOnceWithExactly({
				mid: 'mid-1',
				rid: 'rid-1',
				attachmentIndex: 0,
				fileId: 'file-1',
				languageHint: 'pt-BR',
			}),
		).to.be.true;
	});

	it('skips encrypted rooms and non-pending attachments', () => {
		const message = {
			_id: 'mid-1',
			rid: 'rid-1',
			attachments: [
				{
					type: 'file',
					audio_url: '/file/1',
					audio_type: 'audio/mpeg',
					fileId: 'file-1',
					transcription: { status: 'done', text: 'done' },
				},
			],
		};

		transcribeAudioAttachments(message, { room: { _id: 'rid-1', encrypted: true } });
		transcribeAudioAttachments(message, { room: { _id: 'rid-1' } });

		expect(transcribeMessageAttachment.called).to.be.false;
	});

	it('skips messages when transcription is disabled', () => {
		settingsGet.withArgs('AI_Voice_Transcription_Enabled').returns(false);

		const message = {
			_id: 'mid-1',
			rid: 'rid-1',
			attachments: [
				{
					type: 'file',
					audio_url: '/file/1',
					audio_type: 'audio/mpeg',
					fileId: 'file-1',
					transcription: { status: 'pending' },
				},
			],
		};

		transcribeAudioAttachments(message, { room: { _id: 'rid-1' } });

		expect(transcribeMessageAttachment.called).to.be.false;
	});

	it('logs instead of swallowing a failed enqueue', async () => {
		transcribeMessageAttachment.rejects(new Error('service unavailable'));

		const message = {
			_id: 'mid-1',
			rid: 'rid-1',
			attachments: [
				{
					type: 'file',
					audio_url: '/file/1',
					audio_type: 'audio/mpeg',
					fileId: 'file-1',
					transcription: { status: 'pending' },
				},
			],
		};

		transcribeAudioAttachments(message, { room: { _id: 'rid-1' } });
		await new Promise((resolve) => setImmediate(resolve));

		expect(logError.calledOnce).to.be.true;
		expect(logError.firstCall.args[0]).to.deep.include({ mid: 'mid-1', fileId: 'file-1' });
	});
});
