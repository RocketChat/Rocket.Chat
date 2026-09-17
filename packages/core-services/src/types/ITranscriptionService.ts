import type { IServiceClass } from './ServiceClass';

export interface ITranscriptionService extends IServiceClass {
	transcribeMessageAttachment(params: {
		mid: string;
		rid: string;
		attachmentIndex: number;
		fileId: string;
		languageHint?: string;
	}): Promise<void>;

	status(): Promise<{
		enabled: boolean;
		engine: string;
		configured: boolean;
	}>;
}
