import {
	createEngine,
	isTranscriptionError,
	type TranscriptionEngine,
	type TranscriptionEngineConfig,
	type TranscriptionEngineName,
	type TranscriptionFetch,
} from '@rocket.chat/ai-transcription';
import { ServiceClass, Settings as settingsService, Upload as uploadService, api } from '@rocket.chat/core-services';
import type { ITranscriptionService } from '@rocket.chat/core-services';
import type { AudioAttachmentProps, AudioTranscription, FileAttachmentProps, IMessage, MessageAttachment } from '@rocket.chat/core-typings';
import { isFileAudioAttachment } from '@rocket.chat/core-typings';
import type { Logger } from '@rocket.chat/logger';
import { Messages, Uploads } from '@rocket.chat/models';
import { serverFetch } from '@rocket.chat/server-fetch';

type TranscriptionJob = {
	mid: string;
	rid: string;
	attachmentIndex: number;
	fileId: string;
	languageHint?: string;
};

type TranscriptionSettings = {
	enabled: boolean;
	engine: TranscriptionEngineName;
	whisperServerUrl: string;
	openAIBaseUrl: string;
	openAIApiKey: string;
	openAIModel: string;
	language: string;
	maxFileSizeKB: number;
	timeoutSeconds: number;
	maxConcurrentJobs: number;
	ssrfAllowlist: string;
};

const asString = (value: unknown): string => {
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	return '';
};

const asNumber = (value: unknown, fallback: number): number => {
	const parsed = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const asBoolean = (value: unknown): boolean => value === true;

const isAudioAttachment = (attachment: MessageAttachment | undefined): attachment is AudioAttachmentProps & { type: 'file' } =>
	Boolean(attachment && isFileAudioAttachment(attachment as FileAttachmentProps));

export class TranscriptionService extends ServiceClass implements ITranscriptionService {
	protected name = 'transcription';

	private readonly log: Logger;

	private readonly queue: TranscriptionJob[] = [];

	private currentJobNumber = 0;

	private config: TranscriptionSettings = {
		enabled: false,
		engine: 'whisper-cpp-server',
		whisperServerUrl: 'http://localhost:8080',
		openAIBaseUrl: 'https://api.openai.com/v1',
		openAIApiKey: '',
		openAIModel: 'whisper-1',
		language: '',
		maxFileSizeKB: 25600,
		timeoutSeconds: 120,
		maxConcurrentJobs: 1,
		ssrfAllowlist: '',
	};

	private engine: TranscriptionEngine | undefined;

	constructor(loggerConstructor: typeof Logger) {
		super();
		// eslint-disable-next-line new-cap
		this.log = new loggerConstructor('TranscriptionService');

		this.onSettingChanged('AI_Voice_Transcription_Enabled', async ({ setting }) => {
			this.config.enabled = asBoolean(setting.value);
			this.rebuildEngine();
		});
		this.onSettingChanged('AI_Voice_Transcription_Engine', async ({ setting }) => {
			this.config.engine = asString(setting.value) === 'openai-compatible' ? 'openai-compatible' : 'whisper-cpp-server';
			this.rebuildEngine();
		});
		this.onSettingChanged('AI_Voice_Transcription_Whisper_Server_URL', async ({ setting }) => {
			this.config.whisperServerUrl = asString(setting.value);
			this.rebuildEngine();
		});
		this.onSettingChanged('AI_Voice_Transcription_OpenAI_Base_URL', async ({ setting }) => {
			this.config.openAIBaseUrl = asString(setting.value);
			this.rebuildEngine();
		});
		this.onSettingChanged('AI_Voice_Transcription_OpenAI_API_Key', async ({ setting }) => {
			this.config.openAIApiKey = asString(setting.value);
			this.rebuildEngine();
		});
		this.onSettingChanged('AI_Voice_Transcription_OpenAI_Model', async ({ setting }) => {
			this.config.openAIModel = asString(setting.value) || 'whisper-1';
			this.rebuildEngine();
		});
		this.onSettingChanged('AI_Voice_Transcription_Language', async ({ setting }) => {
			this.config.language = asString(setting.value);
		});
		this.onSettingChanged('AI_Voice_Transcription_Max_File_Size_KB', async ({ setting }) => {
			this.config.maxFileSizeKB = asNumber(setting.value, 25600);
		});
		this.onSettingChanged('AI_Voice_Transcription_Timeout_Seconds', async ({ setting }) => {
			this.config.timeoutSeconds = asNumber(setting.value, 120);
		});
		this.onSettingChanged('AI_Voice_Transcription_Max_Concurrent_Jobs', async ({ setting }) => {
			this.config.maxConcurrentJobs = Math.max(1, asNumber(setting.value, 1));
			this.drainQueue();
		});
		this.onSettingChanged('SSRF_Allowlist', async ({ setting }) => {
			this.config.ssrfAllowlist = asString(setting.value);
		});
	}

	override async started(): Promise<void> {
		const [
			enabled,
			engine,
			whisperServerUrl,
			openAIBaseUrl,
			openAIApiKey,
			openAIModel,
			language,
			maxFileSizeKB,
			timeoutSeconds,
			maxConcurrentJobs,
			ssrfAllowlist,
		] = await Promise.all([
			settingsService.get<boolean>('AI_Voice_Transcription_Enabled'),
			settingsService.get<string>('AI_Voice_Transcription_Engine'),
			settingsService.get<string>('AI_Voice_Transcription_Whisper_Server_URL'),
			settingsService.get<string>('AI_Voice_Transcription_OpenAI_Base_URL'),
			settingsService.get<string>('AI_Voice_Transcription_OpenAI_API_Key'),
			settingsService.get<string>('AI_Voice_Transcription_OpenAI_Model'),
			settingsService.get<string>('AI_Voice_Transcription_Language'),
			settingsService.get<number>('AI_Voice_Transcription_Max_File_Size_KB'),
			settingsService.get<number>('AI_Voice_Transcription_Timeout_Seconds'),
			settingsService.get<number>('AI_Voice_Transcription_Max_Concurrent_Jobs'),
			settingsService.get<string>('SSRF_Allowlist'),
		]);

		this.config = {
			enabled: asBoolean(enabled),
			engine: asString(engine) === 'openai-compatible' ? 'openai-compatible' : 'whisper-cpp-server',
			whisperServerUrl: asString(whisperServerUrl) || 'http://localhost:8080',
			openAIBaseUrl: asString(openAIBaseUrl) || 'https://api.openai.com/v1',
			openAIApiKey: asString(openAIApiKey),
			openAIModel: asString(openAIModel) || 'whisper-1',
			language: asString(language),
			maxFileSizeKB: asNumber(maxFileSizeKB, 25600),
			timeoutSeconds: asNumber(timeoutSeconds, 120),
			maxConcurrentJobs: Math.max(1, asNumber(maxConcurrentJobs, 1)),
			ssrfAllowlist: asString(ssrfAllowlist),
		};

		this.rebuildEngine();
	}

	async status(): Promise<{ enabled: boolean; engine: string; configured: boolean }> {
		return {
			enabled: this.config.enabled,
			engine: this.config.engine,
			configured: Boolean(this.engine),
		};
	}

	async transcribeMessageAttachment(params: TranscriptionJob): Promise<void> {
		this.queue.push(params);
		this.drainQueue();
	}

	private rebuildEngine(): void {
		try {
			this.engine = createEngine(this.getEngineConfig());
		} catch (error) {
			this.engine = undefined;
			this.log.debug({
				msg: 'Transcription engine is not configured',
				err: error instanceof Error ? error.message : String(error),
			});
		}
	}

	private getEngineConfig(): TranscriptionEngineConfig {
		if (this.config.engine === 'openai-compatible') {
			return {
				engine: 'openai-compatible',
				baseUrl: this.config.openAIBaseUrl,
				apiKey: this.config.openAIApiKey,
				model: this.config.openAIModel,
			};
		}

		return {
			engine: 'whisper-cpp-server',
			url: this.config.whisperServerUrl,
		};
	}

	private drainQueue(): void {
		while (this.currentJobNumber < this.config.maxConcurrentJobs && this.queue.length > 0) {
			const job = this.queue.shift();
			if (!job) {
				return;
			}

			this.currentJobNumber += 1;
			void this.runJob(job)
				.catch((error) => {
					this.log.error({ msg: 'Unexpected transcription job failure', err: error, mid: job.mid, fileId: job.fileId });
				})
				.finally(() => {
					this.currentJobNumber -= 1;
					this.drainQueue();
				});
		}
	}

	private async runJob(job: TranscriptionJob): Promise<void> {
		const message = await Messages.findOneById(job.mid);
		const attachment = message?.attachments?.[job.attachmentIndex];

		if (!message || !isAudioAttachment(attachment)) {
			this.log.warn({ msg: 'Skipping transcription for missing audio attachment', mid: job.mid, attachmentIndex: job.attachmentIndex });
			return;
		}

		if (attachment.transcription?.status === 'done') {
			return;
		}

		if (!this.config.enabled) {
			await this.persistTranscription(job, { status: 'failed', error: 'not-configured', ts: new Date() });
			return;
		}

		if (!this.engine) {
			await this.persistTranscription(job, { status: 'failed', error: 'not-configured', provider: this.config.engine, ts: new Date() });
			return;
		}

		const file = await Uploads.findOneById(job.fileId);
		if (!file) {
			await this.persistTranscription(job, { status: 'failed', error: 'engine-error', provider: this.engine.name, ts: new Date() });
			return;
		}

		const maxBytes = this.config.maxFileSizeKB * 1024;
		if (typeof file.size === 'number' && file.size > maxBytes) {
			await this.persistTranscription(job, { status: 'failed', error: 'file-too-large', provider: this.engine.name, ts: new Date() });
			return;
		}

		try {
			const buffer = await uploadService.getFileBuffer({ file });
			const language = this.config.language || job.languageHint;
			const result = await this.engine.transcribe(
				{
					buffer,
					mimeType: file.type || 'application/octet-stream',
					fileName: file.name || 'audio',
					...(language ? { language } : {}),
				},
				{
					fetch: this.fetchWithSsrfValidation,
					logger: this.log,
					timeoutMs: Math.max(1, this.config.timeoutSeconds) * 1000,
				},
			);

			const detectedLanguage = result.language || language;

			await this.persistTranscription(job, {
				status: 'done',
				text: result.text,
				...(detectedLanguage ? { language: detectedLanguage } : {}),
				provider: this.engine.name,
				ts: new Date(),
			});
		} catch (error) {
			const code = isTranscriptionError(error) ? error.code : 'engine-error';
			this.log.warn({
				msg: 'Transcription failed',
				mid: job.mid,
				fileId: job.fileId,
				code,
				err: error instanceof Error ? error.message : String(error),
			});
			await this.persistTranscription(job, {
				status: 'failed',
				error: code,
				provider: this.engine.name,
				ts: new Date(),
			});
		}
	}

	private fetchWithSsrfValidation: TranscriptionFetch = (url, options) =>
		serverFetch(url, {
			...options,
			ignoreSsrfValidation: false,
			allowList: this.config.ssrfAllowlist,
		});

	private async persistTranscription(job: TranscriptionJob, transcription: AudioTranscription): Promise<void> {
		await Messages.setAttachmentTranscription(job.mid, job.attachmentIndex, transcription);
		const message = await Messages.findOneById<IMessage>(job.mid);
		if (!message) {
			return;
		}

		void api.broadcast('watch.messages', { message });
	}
}
