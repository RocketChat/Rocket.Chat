import { RequestObject } from 'jsonrpc-lite';
import { RequestContext } from './lib/requestContext.ts';

export type Maybe<T> = T | null | undefined;

export const AppObjectRegistry = new class AppObjectRegistry {
	registry: Record<string, unknown> = {};

	public get<T>(key: string): Maybe<T> {
		return this.registry[key] as Maybe<T>;
	}

	public set(key: string, value: unknown): void {
		this.registry[key] = value;
	}

	public has(key: string): boolean {
		return key in this.registry;
	}

	public delete(key: string): void {
		delete this.registry[key];
	}

	public clear(): void {
		this.registry = {};
	}
}

export const RequestContextManager = new class RequestContextManager {
	#requests = new Map<RequestObject['id'], RequestContext>();

	public newForRequest(req: RequestObject, context: RequestContext['context']): RequestContext & Disposable {
		if (this.#requests.has(req.id)) {
			throw new Error('Cannot create new context for known request', { cause: `Request ID #${req.id}` });
		}

		const fullContext = Object.assign({}, req, { context }, {
			[Symbol.dispose]: () => (console.error(`Disposing of request ID #${req.id}`), void this.#requests.delete(req.id)),
		});

		this.#requests.set(req.id, fullContext);

		return fullContext;
	}

	public get(reqId: RequestContext['id']): RequestContext | undefined {
		return this.#requests.get(reqId);
	}

	public getActiveRequestCount(): number {
		return this.#requests.size;
	}
}

