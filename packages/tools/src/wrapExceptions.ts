const isPromise = <T>(value: unknown): value is Promise<T> => !!value && value instanceof Promise;

export function wrapExceptions<T = any>(
	getter: () => T,
): {
	catch: (errorWrapper: (error: any) => T) => T;
	suppress: (errorWrapper?: (error: any) => void) => T | undefined;
};
export function wrapExceptions<T = any>(
	getter: () => Promise<T>,
): {
	catch: (errorWrapper: (error: any) => T | Awaited<T>) => Promise<T>;
	suppress: (errorWrapper?: (error: any) => void) => Promise<T | undefined>;
};
export function wrapExceptions<T>(getter: () => T) {
	const doCatch = (errorWrapper: (error: any) => T | Awaited<T>): T => {
		try {
			const value = getter();
			if (isPromise(value)) {
				return value.catch(errorWrapper) as T;
			}

			return value;
		} catch (error) {
			return errorWrapper(error);
		}
	};

	const doSuppress = (errorWrapper?: (error: any) => void) => {
		try {
			const value = getter();
			if (isPromise(value)) {
				return value.catch((error) => errorWrapper?.(error));
			}

			return value;
		} catch (error) {
			errorWrapper?.(error);
		}
	};

	return {
		catch: doCatch,
		suppress: doSuppress,
	};
}
