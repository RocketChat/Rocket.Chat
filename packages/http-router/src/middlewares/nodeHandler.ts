import type { IncomingMessage, ServerResponse } from 'node:http';

import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';

import type { RootMiddleware } from '../server';

type NodeRequestHandler = (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void;

/**
 * Runs a connect or Express app as a root app middleware. A request the app hands on with `next()` continues to the
 * routes after it; one it answers is left to the app's own response.
 */
export const nodeHandler =
	(handler: NodeRequestHandler): RootMiddleware =>
	async (c, next) => {
		const { incoming, outgoing } = c.env;

		const handedOn = await new Promise<boolean>((resolve, reject) => {
			const answered = () => resolve(false);
			outgoing.once('finish', answered);
			outgoing.once('close', answered);

			handler(incoming, outgoing, (err) => {
				outgoing.off('finish', answered);
				outgoing.off('close', answered);
				if (err) {
					reject(err);
					return;
				}
				resolve(true);
			});
		});

		if (handedOn) {
			return next();
		}
		return RESPONSE_ALREADY_SENT;
	};
