import type { Data } from './Data';

export interface IStrategy {
	renderTemplate(data: Data): Promise<NodeJS.ReadableStream>;
	parseTemplateData(data: Record<string, unknown | unknown[]>): Data;
}
