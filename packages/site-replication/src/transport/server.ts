import { timingSafeEqual } from 'crypto';
import { createServer } from 'http';
import type { IncomingMessage, Server, ServerResponse } from 'http';

import { BSON } from 'mongodb';

import { PROTOCOL_PREFIX } from './protocol';
import type { OpsRequest, PeerHandlers } from './protocol';
import type { Logger, Op, SiteId } from '../types';

const MAX_BODY_BYTES = 64 * 1024 * 1024;

export class NotLeader extends Error {}

const authorized = (req: IncomingMessage, secret: string): boolean => {
	const expected = Buffer.from(`Bearer ${secret}`);
	const received = Buffer.from(req.headers.authorization ?? '');
	return received.length === expected.length && timingSafeEqual(received, expected);
};

const readBody = async (req: IncomingMessage): Promise<unknown> => {
	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of req) {
		size += (chunk as Buffer).length;
		if (size > MAX_BODY_BYTES) {
			throw new Error('request body too large');
		}
		chunks.push(chunk as Buffer);
	}
	return chunks.length ? BSON.EJSON.parse(Buffer.concat(chunks).toString('utf8'), { relaxed: true }) : undefined;
};

const isOpsRequest = (body: unknown): body is OpsRequest => {
	const ops = (body as { ops?: unknown } | undefined)?.ops;
	return (
		Array.isArray(ops) &&
		ops.every(
			(op: Partial<Op>) =>
				typeof op === 'object' &&
				typeof op.seq === 'number' &&
				typeof op.t === 'number' &&
				typeof op.site === 'string' &&
				typeof op.coll === 'string' &&
				typeof op.id === 'string' &&
				['insert', 'update', 'delete'].includes(op.kind as string),
		)
	);
};

const send = (res: ServerResponse, status: number, body: unknown): void => {
	res.writeHead(status, { 'content-type': 'application/json' });
	res.end(BSON.EJSON.stringify(body, { relaxed: false }));
};

/** The endpoint the peer site reaches this site through. Only the configured peer, holding the shared secret, gets in. */
export const createPeerServer = (options: {
	secret: string;
	peer: SiteId;
	handlers: () => PeerHandlers | undefined;
	logger: Logger;
}): Server =>
	createServer(async (req, res) => {
		try {
			if (!authorized(req, options.secret)) {
				return send(res, 401, { error: 'unauthorized' });
			}
			const url = new URL(req.url ?? '/', 'http://peer');
			const from = url.searchParams.get('from');
			if (from !== options.peer) {
				return send(res, 403, { error: 'unknown site' });
			}
			const handlers = options.handlers();
			if (!handlers) {
				return send(res, 503, { error: 'not the replication leader' });
			}
			const route = `${req.method} ${url.pathname.replace(PROTOCOL_PREFIX, '')}`;
			switch (route) {
				case 'GET /hello':
					return send(res, 200, await handlers.hello(from));
				case 'POST /ops': {
					const body = await readBody(req);
					if (!isOpsRequest(body)) {
						return send(res, 400, { error: 'malformed operations' });
					}
					return send(res, 200, await handlers.ops(body));
				}
				case 'POST /heal':
					return send(res, 200, await handlers.heal((await readBody(req)) as never));
				case 'POST /heal/poke':
					await handlers.poke(from);
					return send(res, 200, {});
				default:
					return send(res, 404, { error: 'not found' });
			}
		} catch (err) {
			if (err instanceof NotLeader) {
				return send(res, 503, { error: 'not the replication leader' });
			}
			options.logger.error('peer request failed', { err: String(err), url: req.url });
			return send(res, 500, { error: 'internal error' });
		}
	});
