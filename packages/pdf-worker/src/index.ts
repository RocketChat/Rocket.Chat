import exportTranscript, { isOmnichannelData } from './templates/transcriptTemplate';

export type Data = { header: Record<string, unknown>; body: unknown[]; footer: Record<string, unknown> };

export type Templates = 'omnichannel-transcript';

export class PdfWorker {
	protected validMimeTypes = ['image/jpeg', 'image/png'];

	private async renderTemplate(template: Templates, data: Data): Promise<NodeJS.ReadableStream> {
		switch (template) {
			case 'omnichannel-transcript':
				if (!isOmnichannelData(data)) {
					throw new Error('Invalid data');
				}
				return exportTranscript(data);
			default:
				throw new Error('Template not found');
		}
	}

	private parseTemplateData(template: Templates, data: Record<string, unknown | unknown[]>): Data {
		switch (template) {
			case 'omnichannel-transcript':
				return {
					header: {
						visitor: data.visitor,
						agent: data.agent,
						closedAt: data.closedAt,
						timezone: data.timezone,
					},
					body: Array.isArray(data.messages) ? data.messages : [],
					footer: {},
				};
			default:
				throw new Error('Template not found');
		}
	}

	isMimeTypeValid(mimeType: string): boolean {
		return this.validMimeTypes.includes(mimeType);
	}

	async renderToStream({
		template,
		data,
	}: {
		template: Templates;
		data: Record<string, unknown | unknown[]>;
	}): Promise<NodeJS.ReadableStream> {
		const parsedData = this.parseTemplateData(template, data);
		return this.renderTemplate(template, parsedData);
	}
}
