import { Readable } from 'stream';

import type { Request, Response } from 'express';
import type { Hono } from 'hono';

export const honoAdapter = (hono: Hono) => async (expressReq: Request, res: Response) => {
	(expressReq as unknown as any).duplex = 'half';

	if (Readable.isDisturbed(expressReq)) {
		return;
	}

	const { body, ...req } = expressReq;

	const honoRes = await hono.request(
		expressReq.originalUrl,
		{
			...req,
			...(['POST', 'PUT', 'DELETE'].includes(expressReq.method) && { body: expressReq as unknown as ReadableStream }),
			headers: new Headers(Object.fromEntries(Object.entries(expressReq.headers)) as Record<string, string>),
		},
		{
			incoming: expressReq,
		},
	);
	res.status(honoRes.status);
	honoRes.headers.forEach((value, key) => res.setHeader(key, value));
	// Converting it to a Buffer because res.send appends always a charset to the Content-Type
	// https://github.com/expressjs/express/issues/2238
	res.send(Buffer.from(await honoRes.text()));
};
