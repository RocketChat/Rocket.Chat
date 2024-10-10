import { trace, context } from '@rocket.chat/tracing';

import { AsyncContextStore } from './ContextStore';

export type asyncMethodCallContextStoreItem = {
	type: 'rest' | 'ddp' | 'model';
	userId?: string;
	method?: string;
	route?: string;
}[];

export const asyncMethodCallContextStore = new AsyncContextStore<asyncMethodCallContextStoreItem>();

const tracer = trace.getTracer('core');

export function traceInstanceMethods<T extends object>(instance: T, ignoreMethods: string[] = []): T {
	const className = instance.constructor.name;

	return new Proxy(instance, {
		get(target: Record<string, any>, prop: string): any {
			if (typeof target[prop] === 'function' && !ignoreMethods.includes(prop)) {
				return new Proxy(target[prop], {
					apply: (target, thisArg, argumentsList): any => {
						if (['doNotMixInclusionAndExclusionFields', 'ensureDefaultFields'].includes(prop)) {
							return Reflect.apply(target, thisArg, argumentsList);
						}

						const currentSpan = trace.getSpan(context.active());
						if (currentSpan) {
							// console.log(`in model ${className}.${prop}`);
							const span = tracer.startSpan(`model ${className}.${prop}`, {
								attributes: {
									model: className,
									method: prop,
									parameters: JSON.stringify(argumentsList),
								},
							});
							const result = context.with(trace.setSpan(context.active(), span), () => {
								return Reflect.apply(target, thisArg, argumentsList);
							});
							if (result instanceof Promise) {
								result.finally(() => {
									span.end();
								});
								return result;
							}
							span.end();
							return result;
						}

						console.log(`out model ${className}.${prop}`, new Error().stack);
						return Reflect.apply(target, thisArg, argumentsList);
					},
				});
			}

			return Reflect.get(target, prop);
		},
	}) as T;
}
