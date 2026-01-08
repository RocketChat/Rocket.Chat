import { Readable } from 'stream';

import type { Request, Response } from 'express';
import type { Hono } from 'hono';

export const honoAdapterForExpress = (hono: Hono) => async (expressReq: Request, res: Response) => {
	(expressReq as unknown as any).duplex = 'half';

	if (Readable.isDisturbed(expressReq)) {
		return;
	}

	const { body, ...req } = expressReq;

	// Don't pass body for multipart/form-data to avoid consuming the stream
	// Routes will parse it manually via UploadService.parse() using rawRequest
	const contentType = expressReq.headers['content-type'];
	const isMultipart = contentType?.includes('multipart/form-data');
	const shouldPassBody = ['POST', 'PUT', 'DELETE'].includes(expressReq.method) && !isMultipart;

	const honoRes = await hono.request(
		expressReq.originalUrl,
		{
			...req,
			...(shouldPassBody && { body: expressReq as unknown as ReadableStream }),
			headers: new Headers(Object.fromEntries(Object.entries(expressReq.headers)) as Record<string, string>),
		},
		{
			incoming: expressReq,
		},
	);
	res.status(honoRes.status);
	honoRes.headers.forEach((value, key) => res.setHeader(key, value));

	if (!honoRes.body) {
		res.end();
		return;
	}

	if (honoRes.body instanceof ReadableStream) {
		Readable.fromWeb(honoRes.body as any).pipe(res);
		return;
	}

	// Converting it to a Buffer because res.send appends always a charset to the Content-Type
	// https://github.com/expressjs/express/issues/2238
	res.send(Buffer.from(await honoRes.text()));
};
