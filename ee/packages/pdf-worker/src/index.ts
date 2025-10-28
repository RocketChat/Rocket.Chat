import type { i18n } from 'i18next';

import { ChatTranscript } from './strategies/ChatTranscript';
import type { IStrategy } from './types/IStrategy';
import type { WorkerData } from './types/WorkerData';

export type Templates = 'chat-transcript';

export { Quote, MessageData, WorkerData } from './types/WorkerData';

export class PdfWorker {
	protected validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

	readonly worker: IStrategy;

	constructor(public readonly mode: Templates) {
		if (!mode) {
			throw new Error('Invalid mode');
		}

		this.mode = mode;
		this.worker = this.getWorkerClass();
	}

	private getWorkerClass(): IStrategy {
		switch (this.mode) {
			case 'chat-transcript':
				return new ChatTranscript();
			default:
				throw new Error('Invalid mode');
		}
	}

	isMimeTypeValid(mimeType?: string): boolean {
		if (!mimeType) {
			return false;
		}
		return this.validMimeTypes.includes(mimeType?.toLowerCase());
	}

	async renderToStream({ data, i18n }: { data: WorkerData; i18n: i18n }): Promise<NodeJS.ReadableStream> {
		const parsedData = this.worker.parseTemplateData(data, i18n);
		return this.worker.renderTemplate(parsedData);
	}
}
