type ValueMaybePromiseMaybeUndefined<T> = T extends Promise<any> ? Promise<Awaited<T> | undefined> : T | undefined;
type ValueMaybeAwaited<T> = T extends Promise<any> ? Awaited<T> : T;
type ErrorWrapper<T> = T extends Promise<any> ? ((error: any) => T) | ((error: any) => Awaited<T>) : (error: any) => T;

export const wrapExceptions = <T = any>(getter: () => T) => {
	const catcher = (errorWrapper: ErrorWrapper<T>): T => {
		try {
			const value = getter();
			if (value && value instanceof Promise) {
				return new Promise((resolve, reject) => {
					value.then(resolve, (error) => {
						try {
							const newResult = errorWrapper(error);

							if (newResult && newResult instanceof Promise) {
								newResult.then(resolve, reject);
							} else {
								resolve(newResult);
							}
						} catch (newError) {
							reject(newError);
						}
					});
				}) as T;
			}

			return value;
		} catch (error) {
			return errorWrapper(error);
		}
	};

	const suppress = (errorWrapper?: (error: any) => void): ValueMaybePromiseMaybeUndefined<T> => {
		try {
			const value = getter();
			if (value && value instanceof Promise) {
				return new Promise((resolve, reject) => {
					value.then(resolve, (error) => {
						if (!errorWrapper) {
							return resolve(undefined);
						}

						try {
							const newResult = errorWrapper(error) as undefined | Promise<undefined>;
							if (newResult && newResult instanceof Promise) {
								newResult.then(() => resolve(undefined), reject);
							}
						} catch (newError) {
							reject(newError);
						}
					});
				}) as ValueMaybePromiseMaybeUndefined<T>;
			}

			return value as ValueMaybeAwaited<T>;
		} catch (error) {
			if (errorWrapper) {
				errorWrapper(error);
			}

			// It won't reach this point if it was a promise
			return undefined as ValueMaybePromiseMaybeUndefined<T>;
		}
	};

	return {
		catch: catcher,
		suppress,
	};
};
