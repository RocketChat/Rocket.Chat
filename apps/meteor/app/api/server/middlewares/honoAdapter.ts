import type { Request, Response } from 'express';
import type { Hono } from 'hono';

export const honoAdapter = (hono: Hono) => async (expressReq: Request, res: Response) => {
	(expressReq as unknown as any).duplex = 'half';

	const { body, ...req } = expressReq;

	const honoRes = await hono.request(expressReq.originalUrl, {
		...req,
		...(['POST', 'PUT'].includes(expressReq.method) && { body: expressReq as unknown as ReadableStream }),
		headers: new Headers(Object.fromEntries(Object.entries(expressReq.headers)) as Record<string, string>),
	});

	res.status(honoRes.status);
	honoRes.headers.forEach((value, key) => res.setHeader(key, value));
	res.send(await honoRes.text());
};
