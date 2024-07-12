// eslint-disable-next-line @typescript-eslint/naming-convention
interface LoggerParams {
	type?: 'log' | 'trace' | 'warn' | 'info' | 'debug';
	inputs?: boolean;
	outputs?: boolean;
}

const defaultParams: Required<LoggerParams> = {
	type: 'debug',
	inputs: true,
	outputs: false,
};

export function log(prefix?: string, params: LoggerParams = defaultParams) {
	const options = { ...defaultParams, ...params };

	// if (!process.env.TEST_MODE) {
	// 	return;
	// }

	return function (_target: any, propertyKey: string, descriptor: PropertyDescriptor) {
		const original = descriptor.value;

		descriptor.value = async function (...args: any[]) {
			if (options.inputs) {
				console[options.type](prefix && this[prefix], propertyKey, JSON.stringify(args));
			}

			const result = original.apply(this, args);

			if (options.outputs) {
				console[options.type](propertyKey, result);
			}

			return result;
		};
	};
}
