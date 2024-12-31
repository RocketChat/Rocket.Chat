import { tracerActiveSpan } from '.';

const getArguments = (args: any[]): any[] => {
	return args.map((arg) => {
		if (typeof arg === 'object' && arg != null && 'session' in arg) {
			return '[mongo options with session]';
		}
		return arg;
	});
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
									parameters: getArguments(argumentsList),
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
