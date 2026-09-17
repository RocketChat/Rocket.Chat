export type TranscriptionFetchResponse = {
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
	text(): Promise<string>;
};

export type TranscriptionFetch = (
	url: string,
	options: {
		method: string;
		headers?: Record<string, string>;
		body?: Buffer;
		signal?: AbortSignal;
	},
) => Promise<TranscriptionFetchResponse>;

export type TranscriptionLogger = {
	debug?(payload: Record<string, unknown>): void;
	warn?(payload: Record<string, unknown>): void;
};

export type TranscriptionInput = {
	buffer: Buffer;
	mimeType: string;
	fileName: string;
	language?: string;
};

export type TranscriptionResult = {
	text: string;
	language?: string;
};

export type TranscriptionEngineDeps = {
	fetch: TranscriptionFetch;
	logger?: TranscriptionLogger;
	timeoutMs: number;
};

export type WhisperCppServerEngineConfig = {
	engine: 'whisper-cpp-server';
	url: string;
};

export type OpenAICompatibleEngineConfig = {
	engine: 'openai-compatible';
	baseUrl: string;
	apiKey: string;
	model: string;
};

export type TranscriptionEngineConfig = WhisperCppServerEngineConfig | OpenAICompatibleEngineConfig;

export type TranscriptionEngineName = TranscriptionEngineConfig['engine'];

export type TranscriptionEngine = {
	name: TranscriptionEngineName;
	transcribe(input: TranscriptionInput, deps: TranscriptionEngineDeps): Promise<TranscriptionResult>;
};
