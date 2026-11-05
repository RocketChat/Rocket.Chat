import type { AttributeValue } from '@opentelemetry/api';

import { tracerActiveSpan } from '.';

const isAttributeArray = (values: unknown[]): values is Extract<AttributeValue, unknown[]> => {
	const types = new Set(values.filter((value) => value != null).map((value) => typeof value));
	return types.size <= 1 && [...types].every((type) => type === 'string' || type === 'number' || type === 'boolean');
};

const getArguments = (args: unknown[]): { parameters?: AttributeValue } => {
	const parameters = args.map((arg) => {
		if (typeof arg === 'object' && arg != null && 'session' in arg) {
			return '[mongo options with session]';
		}
		return arg;
	});
	return isAttributeArray(parameters) ? { parameters } : {};
};

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

						return tracerActiveSpan(
							`model ${className}.${prop}`,
							{
								attributes: {
									model: className,
									method: prop,
									...getArguments(argumentsList),
								},
							},
							() => {
								return Reflect.apply(target, thisArg, argumentsList);
							},
						);
					},
				});
			}

			return Reflect.get(target, prop);
		},
	}) as T;
}
