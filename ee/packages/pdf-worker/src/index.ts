import { ChatTranscript } from './strategies/ChatTranscript';
import type { IStrategy } from './types/IStrategy';

export type Templates = 'chat-transcript';

export class PdfWorker {
	protected validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

	mode: Templates;

	worker: IStrategy;

	constructor(mode: Templates) {
		if (!mode) {
			throw new Error('Invalid mode');
		}

		this.mode = mode;
		this.worker = this.getWorkerClass();
	}

	getWorkerClass(): IStrategy {
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

	async renderToStream({ data }: { data: Record<string, unknown | unknown[]> }): Promise<NodeJS.ReadableStream> {
		const parsedData = this.worker.parseTemplateData(data);
		return this.worker.renderTemplate(parsedData);
	}
}
