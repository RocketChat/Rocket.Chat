import { WebApp } from 'meteor/webapp';

import { processGraphNotifications, validateGraphHandshake, WEBHOOK_PATH } from './runtime';
import { settings } from '../../../app/settings/server';

const MAX_BODY_BYTES = 256 * 1024;

WebApp.rawConnectHandlers.use(WEBHOOK_PATH, async (request, response) => {
	const requestUrl = new URL(request.url ?? WEBHOOK_PATH, 'http://localhost');
	const validationToken = validateGraphHandshake(requestUrl.searchParams.get('validationToken'));
	if (validationToken) {
		response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
		response.end(validationToken);
		return;
	}

	if (request.method !== 'POST' || !settings.get<boolean>('Enterprise_Calendar_Enabled')) {
		response.writeHead(404);
		response.end();
		return;
	}

	const chunks: Buffer[] = [];
	let size = 0;
	for await (const chunk of request) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.length;
		if (size > MAX_BODY_BYTES) {
			response.writeHead(413);
			response.end();
			return;
		}
		chunks.push(buffer);
	}

	try {
		const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { value?: unknown };
		if (!Array.isArray(payload.value)) throw new Error('invalid-notification-payload');
		const result = await processGraphNotifications(payload.value);
		if (result.rejected > 0 && result.accepted === 0) {
			response.writeHead(401);
			response.end();
			return;
		}
		response.writeHead(202, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
		response.end('{"accepted":true}');
	} catch {
		response.writeHead(400);
		response.end();
	}
});
