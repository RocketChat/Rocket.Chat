import type { HonoRequest } from 'hono';

import { omit } from '../../../lib/utils/omit';

const { LOG_METHOD_PAYLOAD = 'false', LOG_REST_PAYLOAD = 'false', LOG_REST_METHOD_PAYLOADS = 'false' } = process.env;

export const getMethodArgs =
	LOG_METHOD_PAYLOAD === 'false' && LOG_REST_METHOD_PAYLOADS === 'false'
		? (): null => null
		: (method: string, args: any[]): { arguments: any } => {
				const params = method === 'ufsWrite' ? args.slice(1) : args;

				if (method === 'saveSettings') {
					return { arguments: [args[0].map((arg: any) => omit(arg, 'value'))] };
				}

				if (method === 'saveSetting') {
					return { arguments: [args[0], args[2]] };
				}

				return {
					arguments: params.map((arg) => (typeof arg !== 'object' ? arg : omit(arg, 'password', 'msg', 'pass', 'username', 'message'))),
				};
			};

export const getRestPayload =
	LOG_REST_PAYLOAD === 'false' && LOG_REST_METHOD_PAYLOADS === 'false'
		? (): Promise<null> => Promise.resolve(null)
		: async (request: HonoRequest): Promise<{ payload: unknown } | null> => {
				if (request.header('content-type')?.includes('multipart/form-data')) {
					return { payload: '[multipart/form-data]' };
				}

				return {
					payload: await request.raw
						.clone()
						.json()
						.catch(() => null),
				};
			};
