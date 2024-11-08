import type { ExternalHttpStartParams, IExternalHttpRouter } from '../../../externals';

export class ExternalHttpRouterBuilder {
	constructor(private config: ExternalHttpStartParams, private externalHttpRouterInstance: IExternalHttpRouter) {}

	public async start(): Promise<void> {
		await this.externalHttpRouterInstance.start(this.config);
	}

	public async refreshAPIInstance(): Promise<void> {
		await this.externalHttpRouterInstance.refreshAPIInstance();
	}
}
