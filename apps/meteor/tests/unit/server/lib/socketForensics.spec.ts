import type { Server } from 'http';
import { createServer } from 'http';
import type { AddressInfo } from 'net';
import { Socket } from 'net';

import { expect } from 'chai';
import { afterEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { attachSocketForensics, patchSocketDestroy, patchSocketEnd } from '../../../../server/lib/socketForensics';

const listen = (server: Server): Promise<number> =>
	new Promise((resolve) => server.listen(0, () => resolve((server.address() as AddressInfo).port)));

const waitForCall = async (stub: sinon.SinonStub): Promise<void> => {
	for (let i = 0; i < 100 && !stub.called; i++) {
		await new Promise((resolve) => setTimeout(resolve, 10));
	}
};

describe('socketForensics', () => {
	afterEach(() => sinon.restore());

	describe('attachSocketForensics', () => {
		it('should log response-truncated when the socket dies after headers with an unfinished body', async () => {
			const consoleError = sinon.stub(console, 'error');
			const server = createServer((_req, res) => {
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.write('{"partial":');
				res.socket?.destroy();
			});
			attachSocketForensics(server);
			const port = await listen(server);

			await fetch(`http://127.0.0.1:${port}/dynamic-import/fetch`).catch(() => undefined);
			await waitForCall(consoleError);
			server.close();

			expect(consoleError.calledWithMatch('[socket-forensics] response-truncated', sinon.match(/dynamic-import\/fetch/))).to.be.true;
		});

		it('should not log anything for a response that finishes normally', async () => {
			const consoleError = sinon.stub(console, 'error');
			const server = createServer((_req, res) => {
				res.writeHead(200);
				res.end('ok');
			});
			attachSocketForensics(server);
			const port = await listen(server);

			const response = await fetch(`http://127.0.0.1:${port}/ok`);
			await response.text();
			await new Promise((resolve) => setTimeout(resolve, 20));
			server.close();

			expect(consoleError.called).to.be.false;
		});
	});

	describe('patchSocketDestroy', () => {
		it('should log the destroy call site when a socket with an in-flight response is destroyed', async () => {
			const consoleError = sinon.stub(console, 'error');
			const restore = patchSocketDestroy();

			const server = createServer((_req, res) => {
				res.writeHead(200);
				res.write('partial');
				res.socket?.destroy();
			});
			const port = await listen(server);

			await fetch(`http://127.0.0.1:${port}/killed`).catch(() => undefined);
			await waitForCall(consoleError);
			server.close();
			restore();

			const call = consoleError.getCalls().find((c) => c.args[0] === '[socket-forensics] socket-destroy-mid-response');
			expect(call).to.not.be.undefined;
			const payload = JSON.parse(call?.args[1]);
			expect(payload.url).to.equal('/killed');
			expect(payload.callerStack).to.be.a('string');
		});

		it('should log the end call site when a socket with an in-flight response is ended', async () => {
			const consoleError = sinon.stub(console, 'error');
			const restore = patchSocketEnd();

			const server = createServer((_req, res) => {
				res.writeHead(200);
				res.write('partial');
				res.socket?.end();
			});
			const port = await listen(server);

			await fetch(`http://127.0.0.1:${port}/ended`).catch(() => undefined);
			await waitForCall(consoleError);
			server.close();
			restore();

			const call = consoleError.getCalls().find((c) => c.args[0] === '[socket-forensics] socket-end-mid-response');
			expect(call).to.not.be.undefined;
			expect(JSON.parse(call?.args[1]).url).to.equal('/ended');
		});

		it('should restore the original destroy behavior', () => {
			const original = Socket.prototype.destroy;
			const restore = patchSocketDestroy();
			expect(Socket.prototype.destroy).to.not.equal(original);
			restore();
			expect(Socket.prototype.destroy).to.equal(original);
		});
	});
});
