import type { IStrategy } from './types/IStrategy';
import { OmnichannelPDF } from './strategies/OmnichannelPDF';

export type Templates = 'omnichannel-transcript';

export class PdfWorker {
	protected validMimeTypes = ['image/jpeg', 'image/png'];

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
			case 'omnichannel-transcript':
				return new OmnichannelPDF();
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

	async renderToStream({ data }: { template: Templates; data: Record<string, unknown | unknown[]> }): Promise<NodeJS.ReadableStream> {
		const parsedData = this.worker.parseTemplateData(data);
		return this.worker.renderTemplate(parsedData);
	}
}
