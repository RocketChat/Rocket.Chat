export class BrokerMocked {
	actions: Record<string, (...params: unknown[]) => Promise<unknown>> = {};

	async destroyService(): Promise<void> {
		// no op
	}

	createService(): void {
		// no op
	}

	async call(method: string, data: any): Promise<any> {
		return this.actions[method](data);
	}

	async waitAndCall(method: string, data: any): Promise<any> {
		return this.actions[method](data);
	}

	async broadcastToServices(): Promise<void> {
		// no op
	}

	async broadcast(): Promise<void> {
		// no op
	}

	async broadcastLocal(): Promise<void> {
		// no op
	}

	async nodeList(): Promise<any> {
		// no op
	}

	async start(): Promise<void> {
		// no op
	}

	mockServices(actions: Record<string, () => Promise<unknown>>) {
		this.actions = actions;
	}
}
