import type { IEnvelope } from '../../../definition';

class InMemoryRPCServiceStorage {
	private services = new Map<string, Map<string, (...args: any[]) => Promise<any>>>();

	public createService(serviceName: string): void {
		if (this.services.has(serviceName)) {
			throw new Error(`Cannot register a service with the same name: ${serviceName}`);
		}
		this.services.set(serviceName, new Map());
	}

	public deleteService(serviceName: string): void {
		if (this.services.has(serviceName)) {
			throw new Error(`Service: ${serviceName} does not exist`);
		}
		this.services.delete(serviceName);
	}

	public async registerServiceAction<TInput, TOutput>(
		serviceName: string,
		action: string,
		handler: (input: IEnvelope<TInput>) => Promise<IEnvelope<TOutput>>,
	): Promise<void> {
		const service = this.services.get(serviceName);
		if (!service) {
			throw new Error(`${serviceName} does not exists`);
		}
		service.set(action, handler);
	}

	public getAction<TInput, TOutput>(serviceName: string, action: string): (input: IEnvelope<TInput>) => Promise<IEnvelope<TOutput>> {
		const service = this.services.get(serviceName);
		if (!service) {
			throw new Error(`${serviceName} does not exists`);
		}
		return service.get(action) as (input: IEnvelope<TInput>) => Promise<IEnvelope<TOutput>>;
	}
}

export const RPC_STORAGE = new InMemoryRPCServiceStorage();
