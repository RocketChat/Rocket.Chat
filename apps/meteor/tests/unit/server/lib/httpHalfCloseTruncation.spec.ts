import type { Server } from 'http';
import { createServer } from 'http';
import type { AddressInfo } from 'net';
import { connect } from 'net';

import { expect } from 'chai';
import { describe, it } from 'mocha';

const listen = (server: Server): Promise<number> =>
	new Promise((resolve) => server.listen(0, () => resolve((server.address() as AddressInfo).port)));

// Reproduces the CI dynamic-import truncation flake mechanism (see PR #41399):
// when the client's FIN reaches node while a chunked response is still being
// written, node's http server (httpAllowHalfOpen=false, same shape meteor's
// webapp configures) aborts the in-flight response via socketOnEnd -> socket.end()
// instead of delivering the rest of it. A client that half-closes after fully
// sending its request is entitled to the complete response.
describe('http server response delivery to half-closing clients', () => {
	const startServer = async (): Promise<{ server: Server; port: number }> => {
		const server = createServer((_req, res) => {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.write(`{"head":"${'x'.repeat(1000)}",`);
			setTimeout(() => res.end(`"tail":"${'y'.repeat(1000)}"}`), 50);
		});
		server.setTimeout(5000);
		return { server, port: await listen(server) };
	};

	const request = 'POST /__meteor__/dynamic-import/fetch HTTP/1.1\r\nHost: localhost\r\nContent-Length: 2\r\n\r\n{}';

	const collectResponse = (port: number, halfCloseAfterMs?: number): Promise<string> =>
		new Promise((resolve, reject) => {
			const chunks: Buffer[] = [];
			const socket = connect(port, '127.0.0.1', () => {
				socket.write(request);
				if (halfCloseAfterMs !== undefined) {
					setTimeout(() => socket.end(), halfCloseAfterMs);
				}
			});
			socket.on('data', (chunk) => {
				chunks.push(chunk);
				if (Buffer.concat(chunks).includes('"}')) {
					socket.destroy();
				}
			});
			socket.on('error', reject);
			socket.on('close', () => resolve(Buffer.concat(chunks).toString()));
		});

	it('should deliver the full response to a client that keeps its connection open', async () => {
		const { server, port } = await startServer();
		const response = await collectResponse(port);
		server.close();
		expect(response).to.contain('y'.repeat(1000));
	});

	it('should deliver the full response to a client that half-closes right after sending the request', async () => {
		const { server, port } = await startServer();
		const response = await collectResponse(port, 0);
		server.close();
		expect(response).to.contain('y'.repeat(1000));
	});

	it('should deliver the full response to a client that half-closes after the response headers arrive', async () => {
		const { server, port } = await startServer();
		const response = await collectResponse(port, 20);
		server.close();
		expect(response).to.contain('y'.repeat(1000));
	});
});
