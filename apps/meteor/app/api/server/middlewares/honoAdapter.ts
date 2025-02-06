import type { Request, Response } from 'express';
import type { Hono } from 'hono';

export const honoAdapter = (hono: Hono) => async (expressReq: Request, res: Response) => {
	!['GET', 'HEAD'].includes(expressReq.method) &&
		(await new Promise((resolve) => {
			let data = '';
			expressReq.on('data', (chunk) => {
				data += chunk;
			});
			expressReq.on('end', async () => {
				expressReq.body = data;
				resolve(expressReq.body);
			});
		}));

	const honoRes = await hono.request(expressReq.originalUrl, {
		...expressReq,
		body: expressReq.body,
		headers: new Headers(Object.fromEntries(Object.entries(expressReq.headers)) as Record<string, string>),
	});

	res.status(honoRes.status);
	honoRes.headers.forEach((value, key) => res.setHeader(key, value));
	res.send(await honoRes.text());
};
