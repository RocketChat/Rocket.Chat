import { Logger } from '@rocket.chat/logger';

import { TranscriptionService } from './TranscriptionService';

const mockCreateEngine = jest.fn();
const mockIsTranscriptionError = jest.fn();

jest.mock('@rocket.chat/ai-transcription', () => ({
	createEngine: (...args: unknown[]) => mockCreateEngine(...args),
	isTranscriptionError: (...args: unknown[]) => mockIsTranscriptionError(...args),
}));

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {
		onSettingChanged = jest.fn();
	},
	Settings: {
		get: jest.fn(),
	},
	Upload: {
		getFileBuffer: jest.fn(),
	},
	api: {
		broadcast: jest.fn(),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	Messages: {
		findOneById: jest.fn(),
		setAttachmentTranscription: jest.fn(),
	},
	Uploads: {
		findOneById: jest.fn(),
	},
}));

jest.mock('@rocket.chat/server-fetch', () => ({
	serverFetch: jest.fn(),
}));

jest.mock('@rocket.chat/core-typings', () => ({
	isFileAudioAttachment: (attachment: { audio_url?: string; type?: string }) =>
		attachment?.type === 'file' && typeof attachment.audio_url === 'string',
}));

const { Settings, Upload, api } = jest.requireMock('@rocket.chat/core-services') as {
	Settings: { get: jest.Mock };
	Upload: { getFileBuffer: jest.Mock };
	api: { broadcast: jest.Mock };
};
const { Messages, Uploads } = jest.requireMock('@rocket.chat/models') as {
	Messages: { findOneById: jest.Mock; setAttachmentTranscription: jest.Mock };
	Uploads: { findOneById: jest.Mock };
};

const flushAsync = async (): Promise<void> => {
	for (let i = 0; i < 20; i++) {
		await Promise.resolve();
	}
};

const waitFor = async (assertion: () => void, attempts = 50): Promise<void> => {
	let lastError: unknown;
	for (let i = 0; i < attempts; i++) {
		try {
			assertion();
			return;
		} catch (error) {
			lastError = error;
			await flushAsync();
		}
	}
	throw lastError;
};

describe('TranscriptionService', () => {
	const transcribe = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		transcribe.mockReset();
		mockCreateEngine.mockReturnValue({ name: 'whisper-cpp-server', transcribe });
		mockIsTranscriptionError.mockImplementation((error: unknown) => Boolean(error && typeof error === 'object' && 'code' in error));
		Settings.get.mockImplementation(async (id: string) => {
			switch (id) {
				case 'AI_Voice_Transcription_Enabled':
					return true;
				case 'AI_Voice_Transcription_Engine':
					return 'whisper-cpp-server';
				case 'AI_Voice_Transcription_Whisper_Server_URL':
					return 'http://localhost:8080';
				case 'AI_Voice_Transcription_OpenAI_Base_URL':
					return 'https://api.openai.com/v1';
				case 'AI_Voice_Transcription_OpenAI_API_Key':
					return '';
				case 'AI_Voice_Transcription_OpenAI_Model':
					return 'whisper-1';
				case 'AI_Voice_Transcription_Language':
					return '';
				case 'AI_Voice_Transcription_Max_File_Size_KB':
					return 25600;
				case 'AI_Voice_Transcription_Timeout_Seconds':
					return 120;
				case 'AI_Voice_Transcription_Max_Concurrent_Jobs':
					return 1;
				case 'SSRF_Allowlist':
					return 'localhost';
				default:
					return undefined;
			}
		});
		Messages.findOneById.mockResolvedValue({
			_id: 'mid-1',
			attachments: [
				{
					type: 'file',
					audio_url: '/file-upload/1/voice.mp3',
					transcription: { status: 'pending' },
				},
			],
		});
		Messages.setAttachmentTranscription.mockResolvedValue({ acknowledged: true });
		Uploads.findOneById.mockResolvedValue({
			_id: 'file-1',
			name: 'voice.mp3',
			type: 'audio/mpeg',
			size: 1024,
		});
		Upload.getFileBuffer.mockResolvedValue(Buffer.from('audio'));
		transcribe.mockResolvedValue({ text: 'hello transcript', language: 'en' });
	});

	it('transcribes a pending attachment and broadcasts the updated message', async () => {
		const service = new TranscriptionService(Logger);
		await service.started();

		await service.transcribeMessageAttachment({
			mid: 'mid-1',
			rid: 'rid-1',
			attachmentIndex: 0,
			fileId: 'file-1',
			languageHint: 'en',
		});

		await waitFor(() => {
			expect(Messages.setAttachmentTranscription).toHaveBeenCalledWith(
				'mid-1',
				0,
				expect.objectContaining({
					status: 'done',
					text: 'hello transcript',
					language: 'en',
					provider: 'whisper-cpp-server',
				}),
			);
			expect(api.broadcast).toHaveBeenCalledWith('watch.messages', expect.objectContaining({ message: expect.any(Object) }));
		});

		expect(Upload.getFileBuffer).toHaveBeenCalled();
		expect(transcribe).toHaveBeenCalledWith(
			expect.objectContaining({
				fileName: 'voice.mp3',
				mimeType: 'audio/mpeg',
				language: 'en',
			}),
			expect.objectContaining({ timeoutMs: 120_000 }),
		);
	});

	it('skips attachments that are already done', async () => {
		Messages.findOneById.mockResolvedValue({
			_id: 'mid-1',
			attachments: [
				{
					type: 'file',
					audio_url: '/file-upload/1/voice.mp3',
					transcription: { status: 'done', text: 'already' },
				},
			],
		});

		const service = new TranscriptionService(Logger);
		await service.started();
		await service.transcribeMessageAttachment({
			mid: 'mid-1',
			rid: 'rid-1',
			attachmentIndex: 0,
			fileId: 'file-1',
		});
		await flushAsync();

		expect(Upload.getFileBuffer).not.toHaveBeenCalled();
		expect(Messages.setAttachmentTranscription).not.toHaveBeenCalled();
	});

	it('marks oversized files as failed', async () => {
		Uploads.findOneById.mockResolvedValue({
			_id: 'file-1',
			name: 'voice.mp3',
			type: 'audio/mpeg',
			size: 30_000 * 1024,
		});

		const service = new TranscriptionService(Logger);
		await service.started();
		await service.transcribeMessageAttachment({
			mid: 'mid-1',
			rid: 'rid-1',
			attachmentIndex: 0,
			fileId: 'file-1',
		});
		await flushAsync();

		expect(Messages.setAttachmentTranscription).toHaveBeenCalledWith(
			'mid-1',
			0,
			expect.objectContaining({
				status: 'failed',
				error: 'file-too-large',
			}),
		);
		expect(transcribe).not.toHaveBeenCalled();
	});

	it('reports status from loaded settings', async () => {
		const service = new TranscriptionService(Logger);
		await service.started();
		await expect(service.status()).resolves.toEqual({
			enabled: true,
			engine: 'whisper-cpp-server',
			configured: true,
		});
	});
});
