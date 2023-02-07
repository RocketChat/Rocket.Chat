export const promisify: {
	<TArgs extends any[], TResult>(fn: (...args: [...args: TArgs, callback: (error: any, result: TResult) => void]) => void): (
		...args: TArgs
	) => Promise<TResult>;
	<TArgs extends any[]>(fn: (...args: [...args: TArgs, callback: (error: any, result?: never) => void]) => void): (
		...args: TArgs
	) => Promise<void>;
} =
	<TArgs extends any[], TResult>(fn: (...args: [...args: TArgs, callback: (error: any, result: TResult) => void]) => void) =>
	(...args: TArgs) =>
		new Promise<TResult>((resolve, reject) => {
			fn(...args, (error: any, result: TResult) => {
				if (error) {
					return reject(error);
				}
				return resolve(result);
			});
		});
