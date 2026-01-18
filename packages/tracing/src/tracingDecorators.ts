import { tracerActiveSpan } from '.';

/**
 * Symbol key used to store the attribute extractor on methods
 */
export const TRACE_EXTRACTOR_KEY = Symbol('traceExtractor');

/**
 * Type for the extractor function stored on decorated methods
 */
export type TraceExtractor<TArgs extends unknown[] = unknown[]> = (...args: TArgs) => Record<string, unknown>;

/**
 * Interface for methods that have a trace extractor attached
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export interface ITracedMethod extends Function {
	[TRACE_EXTRACTOR_KEY]?: TraceExtractor;
}

/**
 * Decorator that attaches an attribute extractor to a method for tracing.
 * The extractor receives the method arguments and returns attributes to add to the span.
 *
 * Use this decorator on methods to define inline attribute extraction that
 * will be picked up by `@tracedClass`.
 *
 * @param extractor - Function that extracts trace attributes from method arguments
 *
 * @example
 * @tracedClass({ type: 'service' })
 * class FederationMatrix {
 *   @traced((room: IRoom, owner: IUser) => ({
 *     roomId: room?._id,
 *     roomName: room?.name || room?.fname,
 *     ownerId: owner?._id,
 *   }))
 *   async createRoom(room: IRoom, owner: IUser) {
 *     // method implementation
 *   }
 * }
 */
export function traced<TArgs extends unknown[]>(extractor: (...args: TArgs) => Record<string, unknown>): MethodDecorator {
	return (_target, _propertyKey, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value as ITracedMethod;
		if (originalMethod) {
			originalMethod[TRACE_EXTRACTOR_KEY] = extractor as TraceExtractor;
		}
		return descriptor;
	};
}

/**
 * Get the trace extractor from a method, if one was attached via @traced decorator.
 */
function getTraceExtractor(method: unknown): TraceExtractor | undefined {
	if (typeof method === 'function') {
		return (method as ITracedMethod)[TRACE_EXTRACTOR_KEY];
	}
	return undefined;
}

/**
 * Options for @tracedClass decorator
 */
export interface ITracedClassOptions {
	/**
	 * The type prefix for span names (e.g., 'model', 'service', 'handler')
	 */
	type: string;

	/**
	 * Array of method names to exclude from tracing
	 */
	ignoreMethods?: string[];
}

/**
 * Wraps all methods of an instance with OpenTelemetry tracing spans.
 * Used internally by @tracedClass decorator.
 */
function traceInstanceMethods<T extends object>(instance: T, options: ITracedClassOptions): T {
	const className = instance.constructor.name;

	const { type, ignoreMethods = [] } = options;

	return new Proxy(instance, {
		get(target: Record<string, any>, prop: string): any {
			if (typeof target[prop] === 'function' && !ignoreMethods.includes(prop)) {
				return new Proxy(target[prop], {
					apply: (target, thisArg, argumentsList): any => {
						if (['doNotMixInclusionAndExclusionFields', 'ensureDefaultFields'].includes(prop)) {
							return Reflect.apply(target, thisArg, argumentsList);
						}

						const attributes: Record<string, unknown> = {
							[type]: className,
							method: prop,
						};

						const extractor = getTraceExtractor(target);

						if (extractor) {
							try {
								const extractedAttrs = extractor(...(argumentsList as unknown[]));
								Object.assign(attributes, extractedAttrs);
							} catch {
								// If extractor fails, continue with base attributes
							}
						}

						return tracerActiveSpan(
							`${type} ${className}.${prop}`,
							{ attributes: attributes as Record<string, string | number | boolean | undefined> },
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

/**
 * Class decorator that automatically wraps all methods with OpenTelemetry tracing spans.
 *
 * @param options - Configuration options for tracing
 *
 * @example
 * @tracedClass({ type: 'service' })
 * class FederationMatrix extends ServiceClass {
 *   @traced((room: IRoom, owner: IUser) => ({ roomId: room?._id }))
 *   async createRoom(room: IRoom, owner: IUser) { ... }
 * }
 *
 * @example
 * @tracedClass({ type: 'model' })
 * class UsersRaw extends BaseRaw<IUser> { ... }
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function tracedClass(options: ITracedClassOptions): <TFunction extends Function>(target: TFunction) => TFunction {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return <TFunction extends Function>(target: TFunction): TFunction => {
		// Use a wrapper function that preserves `new.target` for proper inheritance
		const newConstructor = function (this: any, ...args: any[]) {
			// Reflect.construct properly handles inheritance by using new.target
			// This ensures subclasses work correctly when extending a decorated class
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore - new.target is valid in constructor functions
			const instance = Reflect.construct(target as any, args, new.target || newConstructor);
			return traceInstanceMethods(instance, options);
		};

		newConstructor.prototype = target.prototype;
		Object.setPrototypeOf(newConstructor, target);
		Object.defineProperty(newConstructor, 'name', { value: target.name });

		return newConstructor as unknown as TFunction;
	};
}
