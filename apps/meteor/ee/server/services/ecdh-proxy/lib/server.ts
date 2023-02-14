import type { RequestOptions } from 'http';
import http from 'http';
import url from 'url';
import type { Readable } from 'stream';

import WebSocket from 'ws';
import cookie from 'cookie';
import type { Request, Response } from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import mem from 'mem';

import { ServerSession } from '../../../../app/ecdh/server/ServerSession';

const app = express();
app.use(cookieParser());

const port = process.env.PORT || 4000;

function streamToBuffer(stream: Readable): Promise<Buffer> {
	return new Promise((resolve) => {
		const buffers: any[] = [];
		stream.on('data', (d) => buffers.push(d));
		stream.on('end', () => {
			resolve(Buffer.concat(buffers));
		});
		stream.resume();
	});
}

async function getSession(clientPublicKey: string): Promise<ServerSession> {
	const serverSession = new ServerSession();
	await serverSession.init(clientPublicKey);
	return serverSession;
}

const getSessionCached = mem(getSession, { maxAge: 1000 });

const _processRequest = async (session: ServerSession, requestData: Buffer): Promise<string> => session.decrypt(requestData);
const _processResponse = async (session: ServerSession, responseData: Buffer): Promise<string> => session.encrypt(responseData);

const proxyHostname = process.env.PROXY_HOST || 'localhost';
const proxyPort = process.env.PROXY_PORT || 3000;

const proxy = async function (
	req: Request,
	res: Response,
	session?: ServerSession,
	processRequest = _processRequest,
	processResponse = _processResponse,
): Promise<void> {
	req.pause();
	const options: RequestOptions = url.parse(req.originalUrl || '');
	options.headers = req.headers;
	options.method = req.method;
	options.agent = false;
	options.hostname = proxyHostname;
	options.port = proxyPort;
	if (session) {
		// Required to not receive gzipped data
		delete options.headers['accept-encoding'];
		// Required since we don't know the new length
		delete options.headers['content-length'];
	}

	const connector = http.request(options, async function (serverResponse) {
		serverResponse.pause();
		if (serverResponse.statusCode) {
			res.writeHead(serverResponse.statusCode, serverResponse.headers);
		}
		if (session) {
			const responseData = await streamToBuffer(serverResponse);
			if (responseData.length) {
				res.write(await processResponse(session, responseData));
			}
			res.end();
			// session.encryptStream(serverResponse, processInput, processOutput).pipe(res);
		} else {
			serverResponse.pipe(res);
		}
		serverResponse.resume();
	});

	connector.on('error', (error) => console.error(error));

	if (session) {
		const requestData = await streamToBuffer(req);
		if (requestData.length) {
			connector.write(await processRequest(session, requestData));
		}
		connector.end();
	} else {
		req.pipe(connector);
	}
	req.resume();
};

app.use('/api/ecdh_proxy', express.json());
app.post('/api/ecdh_proxy/initEncryptedSession', async (req, res) => {
	try {
		const session = await getSessionCached(req.body.clientPublicKey);

		res.cookie('ecdhSession', req.body.clientPublicKey);
		res.send({
			success: true,
			publicKeyString: session.publicKeyString,
		});
	} catch (e) {
		res.status(400).send(e instanceof Error ? e.message : String(e));
	}
});

app.post('/api/ecdh_proxy/echo', async (req, res) => {
	if (!req.cookies.ecdhSession) {
		return res.status(401).send();
	}

	const session = await getSessionCached(req.cookies.ecdhSession);

	if (!session) {
		return res.status(401).send();
	}

	try {
		const result = await session.decrypt(req.body.text);
		res.send(await session.encrypt(result));
	} catch (e) {
		console.error(e);
		res.status(400).send(e instanceof Error ? e.message : String(e));
	}
});

const httpServer = app.listen(port, () => {
	console.log(`Proxy listening at http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server: httpServer });

wss.on('error', (error) => {
	console.error(error);
});

wss.on('connection', async (ws, req) => {
	if (!req.url) {
		return;
	}

	const cookies = cookie.parse(req.headers.cookie || '');

	if (!cookies.ecdhSession) {
		ws.close();
		return;
	}

	const session = await getSessionCached(cookies.ecdhSession);

	const proxy = new WebSocket(`ws://${proxyHostname}:${proxyPort}${req.url}` /* , { agent: req.agent } */);

	ws.on('message', async (data: string) => {
		const decrypted = JSON.stringify([await session.decrypt(data.replace('["', '').replace('"]', ''))]);
		proxy.send(decrypted);
	});

	proxy.on('message', async (data: string) => {
		ws.send(await session.encrypt(data.toString()));
	});

	proxy.on('error', (error) => {
		console.error(error);
	});

	ws.on('error', (error) => {
		console.error(error);
	});

	ws.on('close', (code, reason) => {
		try {
			proxy.close(code, reason);
		} catch (e) {
			//
		}
	});
	// proxy.on('close', (code, reason) => ws.close(code, reason));
});

app.use('/api/*', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	const session = await getSessionCached(req.cookies.ecdhSession);

	if (!session) {
		return res.status(401).send();
	}

	try {
		proxy(req, res, session);
	} catch (e) {
		res.status(400).send(e instanceof Error ? e.message : String(e));
	}
});

const xhrDataRequestProcess: typeof _processRequest = async (session, requestData) => {
	const data: string[] = JSON.parse(requestData.toString());

	for await (const [index, item] of data.entries()) {
		data[index] = await session.decrypt(item);
	}

	return JSON.stringify(data);
};

const xhrDataResponseProcess: typeof _processResponse = async (session, responseData) => {
	const data = responseData.toString().replace(/\n$/, '').split('\n');

	for await (const [index, item] of data.entries()) {
		data[index] = await session.encrypt(item);
	}

	return `${data.join('\n')}\n`;
};

app.use('/sockjs/:id1/:id2/xhr_send', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	const session = await getSessionCached(req.cookies.ecdhSession);

	if (!session) {
		return res.status(401).send();
	}

	try {
		proxy(req, res, session, xhrDataRequestProcess, xhrDataResponseProcess);
	} catch (e) {
		res.status(400).send(e instanceof Error ? e.message : String(e));
	}
});

app.use('/sockjs/:id1/:id2/xhr', async (req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');

	const session = await getSessionCached(req.cookies.ecdhSession);

	if (!session) {
		return res.status(401).send();
	}

	try {
		proxy(req, res, session, undefined, xhrDataResponseProcess);
	} catch (e) {
		res.status(400).send(e instanceof Error ? e.message : String(e));
	}
});

app.use((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	proxy(req, res);
});
