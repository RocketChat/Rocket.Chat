import exportTranscript from './templates/transcriptTemplate';

export type Data = { header: Record<string, unknown>; body: unknown[]; footer: Record<string, unknown> };

export class PdfWorker {
	protected validMimeTypes = ['image/jpeg', 'image/png'];

	private async renderTemplate(template: string, data: any): Promise<NodeJS.ReadableStream> {
		switch (template) {
			case 'omnichannel-transcript':
				return exportTranscript(data);
			default:
				throw new Error('Template not found');
		}
	}

	private parseTemplateData(template: string, data: any): Data {
		switch (template) {
			case 'omnichannel-transcript':
				return {
					header: {
						visitor: data.visitor,
						agent: data.agent,
					},
					body: data.messages,
					footer: {},
				};
			default:
				throw new Error('Template not found');
		}
	}

	isMimeTypeValid(mimeType: string): boolean {
		return this.validMimeTypes.includes(mimeType);
	}

	async renderToStream({ template, data }: { details: any; template: string; data: any }): Promise<NodeJS.ReadableStream> {
		const parsedData = this.parseTemplateData(template, data);
		return this.renderTemplate(template, parsedData);
	}
}
