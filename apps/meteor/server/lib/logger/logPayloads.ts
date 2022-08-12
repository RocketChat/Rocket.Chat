import _ from 'underscore';

const { LOG_METHOD_PAYLOAD = 'false', LOG_REST_PAYLOAD = 'false', LOG_REST_METHOD_PAYLOADS = 'false' } = process.env;

export const getMethodArgs =
	LOG_METHOD_PAYLOAD === 'false' && LOG_REST_METHOD_PAYLOADS === 'false'
		? (): null => null
		: (method: string, args: any[]): { arguments: any } => {
				const params = method === 'ufsWrite' ? args.slice(1) : args;

				if (method === 'saveSettings') {
					return { arguments: [args[0].map((arg: any) => _.omit(arg, 'value'))] };
				}

				if (method === 'saveSetting') {
					return { arguments: [args[0], args[2]] };
				}

				return {
					arguments: params.map((arg) => (typeof arg !== 'object' ? arg : _.omit(arg, 'password', 'msg', 'pass', 'username', 'message'))),
				};
		  };

export const getRestPayload =
	LOG_REST_PAYLOAD === 'false' && LOG_REST_METHOD_PAYLOADS === 'false'
		? (): null => null
		: (payload: unknown): { payload: unknown } => ({
				payload,
		  });
