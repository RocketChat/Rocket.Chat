import type { i18n } from 'i18next';

import type { ChatTranscriptData } from './ChatTranscriptData';
import type { WorkerData } from './WorkerData';

export interface IStrategy {
	renderTemplate(data: ChatTranscriptData): Promise<NodeJS.ReadableStream>;
	parseTemplateData(data: WorkerData, i18n: i18n): ChatTranscriptData;
}
