export interface IPDFWorkerService {
	getConfig(): unknown;
	renderToStream({ details, template, data }: { details: any; template: string; data: any }): Promise<void>;
}
