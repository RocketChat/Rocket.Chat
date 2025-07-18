import { Readable, PassThrough } from 'stream';

import type { Request, Response as ExpressResponse } from 'express';
import type { Hono } from 'hono';

import { honoAdapterForExpress } from './honoAdapterForExpress';

const stringToReadableStream = (str: string): ReadableStream<Uint8Array> => {
	const encoder = new TextEncoder();
	return new ReadableStream({
		start(controller) {
			controller.enqueue(encoder.encode(str));
			controller.close();
		},
	});
};

const bufferToReadableStream = (buffer: Buffer): ReadableStream<Uint8Array> => {
	return new ReadableStream({
		start(controller) {
			controller.enqueue(new Uint8Array(buffer));
			controller.close();
		},
	});
};

const createMockResponse = () => {
	const passthrough = new PassThrough();
	const chunks: Buffer[] = [];
	passthrough.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

	const mockResBase = passthrough as any;
	mockResBase.status = jest.fn().mockReturnThis();
	mockResBase.setHeader = jest.fn().mockReturnThis();
	mockResBase.send = jest.fn().mockReturnThis();
	mockResBase.getHeader = jest.fn();
	mockResBase.getHeaders = jest.fn();

	const getOutputBuffer = () => Buffer.concat(chunks);
	const getOutputString = (encoding: BufferEncoding = 'utf-8') => getOutputBuffer().toString(encoding);

	return { mockRes: mockResBase as ExpressResponse, getOutputBuffer, getOutputString };
};

describe('honoAdapterForExpress', () => {
	let mockHono: Hono;
	let mockExpressRequest: Request;

	beforeEach(() => {
		mockHono = {
			request: jest.fn(),
		} as unknown as Hono;

		mockExpressRequest = {
			originalUrl: '/test',
			method: 'GET',
			headers: { 'x-test-header': 'test-value' },
			body: undefined,
			on: jest.fn(),
			readable: true,
			socket: { encrypted: false } as any,
		} as unknown as Request;
		(mockExpressRequest as any).duplex = 'half';
	});

	it('should adapt a Hono response with JSON body', async () => {
		const jsonData = { message: 'hello' };
		const jsonString = JSON.stringify(jsonData);
		const mockHonoResponse = new Response(stringToReadableStream(jsonString), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		});
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes, getOutputString } = createMockResponse();
		const adapter = honoAdapterForExpress(mockHono);

		await adapter(mockExpressRequest, mockRes);

		expect(mockHono.request).toHaveBeenCalledWith(
			'/test',
			expect.objectContaining({
				method: 'GET',
				headers: expect.any(Headers),
			}),
			expect.anything(),
		);
		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'application/json');

		await new Promise((resolve) => (mockRes as any).on('finish', resolve));
		expect(getOutputString()).toBe(jsonString);
	});

	it('should adapt a Hono response with text body', async () => {
		const textData = 'Hello, world!';
		const mockHonoResponse = new Response(stringToReadableStream(textData), {
			status: 201,
			headers: { 'content-type': 'text/plain' },
		});
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes, getOutputString } = createMockResponse();
		const adapter = honoAdapterForExpress(mockHono);

		await adapter(mockExpressRequest, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(201);
		expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'text/plain');

		await new Promise((resolve) => (mockRes as any).on('finish', resolve));
		expect(getOutputString()).toBe(textData);
	});

	it('should adapt a Hono response with image (Buffer) body', async () => {
		const imageBuffer = Buffer.from([1, 2, 3, 4, 5]);
		const mockHonoResponse = new Response(bufferToReadableStream(imageBuffer), {
			status: 200,
			headers: { 'content-type': 'image/png' },
		});
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes, getOutputBuffer } = createMockResponse();
		const adapter = honoAdapterForExpress(mockHono);

		await adapter(mockExpressRequest, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(200);
		expect(mockRes.setHeader).toHaveBeenCalledWith('content-type', 'image/png');

		await new Promise((resolve) => (mockRes as any).on('finish', resolve));
		expect(getOutputBuffer()).toEqual(imageBuffer);
	});

	it('should adapt a Hono response with no body', async () => {
		const mockHonoResponse = new Response(null, {
			status: 204,
			headers: { 'x-custom-header': 'empty' },
		});
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes, getOutputString } = createMockResponse();
		const adapter = honoAdapterForExpress(mockHono);

		await adapter(mockExpressRequest, mockRes);

		expect(mockRes.status).toHaveBeenCalledWith(204);
		expect(mockRes.setHeader).toHaveBeenCalledWith('x-custom-header', 'empty');

		await new Promise((resolve) => (mockRes as any).on('finish', resolve));
		expect(getOutputString()).toBe('');
	});

	it('should handle POST request with body', async () => {
		const postBody = { data: 'some data' };
		const postBodyString = JSON.stringify(postBody);

		const mockPostRequest = {
			...mockExpressRequest,
			method: 'POST',
			body: Readable.from(postBodyString) as any,
			headers: { 'content-type': 'application/json', 'content-length': String(postBodyString.length) },
		} as Request;
		(mockPostRequest as any).duplex = 'half';

		const mockHonoResponse = new Response(stringToReadableStream('{"status":"ok"}'), {
			status: 200,
			headers: { 'content-type': 'application/json' },
		});
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes, getOutputString } = createMockResponse();
		const adapter = honoAdapterForExpress(mockHono);

		await adapter(mockPostRequest, mockRes);

		expect(mockHono.request).toHaveBeenCalledWith(
			'/test',
			expect.objectContaining({
				method: 'POST',
				body: expect.anything(),
				headers: expect.any(Headers),
			}),
			expect.anything(),
		);
		const calledWithHeaders = (mockHono.request as jest.Mock).mock.calls[0][1].headers as Headers;
		expect(calledWithHeaders.get('content-type')).toBe('application/json');

		expect(mockRes.status).toHaveBeenCalledWith(200);

		await new Promise((resolve) => (mockRes as any).on('finish', resolve));
		expect(getOutputString()).toBe('{"status":"ok"}');
	});

	it('should correctly set duplex and handle isDisturbed for request stream', async () => {
		const mockHonoResponse = new Response(null, { status: 204 });
		(mockHono.request as jest.Mock).mockResolvedValue(mockHonoResponse);

		const { mockRes } = createMockResponse();
		const adapter = honoAdapterForExpress(mockHono);

		mockExpressRequest.on = jest.fn();
		Object.defineProperty(mockExpressRequest, 'readableFlowing', { value: null, writable: true });

		jest.spyOn(Readable, 'isDisturbed').mockReturnValue(false);
		await adapter(mockExpressRequest, mockRes);

		expect((mockExpressRequest as any).duplex).toBe('half');
		expect(mockHono.request).toHaveBeenCalledTimes(1);

		(mockHono.request as jest.Mock).mockClear();
		jest.spyOn(Readable, 'isDisturbed').mockReturnValue(true);
		await adapter(mockExpressRequest, mockRes);

		expect(mockHono.request).not.toHaveBeenCalled();

		jest.restoreAllMocks();
	});
});
