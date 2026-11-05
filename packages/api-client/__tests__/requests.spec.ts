import fetchMock from 'jest-fetch-mock';

import { RestClient } from '../src/index';

beforeAll(() => {
	fetchMock.enableMocks();
});

afterAll(() => {
	fetchMock.disableMocks();
});

beforeEach(() => {
	fetchMock.resetMocks();
	fetchMock.doMock();
	fetchMock.mockResponse(JSON.stringify({ status: 'success' }));
});

const lastCall = () => {
	const { calls } = fetchMock.mock;
	expect(calls.length).toBeGreaterThan(0);
	return calls[calls.length - 1];
};

const methodOf = (call: any) => (call[1] as RequestInit).method;
const bodyOf = (call: any) => (call[1] as RequestInit).body;
const headerOf = (call: any, name: string) => (call[1] as RequestInit).headers?.[name as keyof HeadersInit];

test('DELETE with object params serializes JSON body and sets Content-Type', async () => {
	const client = new RestClient({ baseUrl: 'https://example.com' });

	const result = await client.delete('/v1/rooms.cleanHistory', { roomId: 'abc', latest: '2020-01-01' });

	expect(result).toMatchObject({ status: 'success' });
	const call = lastCall();
	expect(methodOf(call)).toBe('DELETE');
	expect(JSON.parse(bodyOf(call) as string)).toEqual({ roomId: 'abc', latest: '2020-01-01' });
	expect(headerOf(call, 'Content-Type')).toBe('application/json');
});

test('DELETE without params sends no body and no Content-Type', async () => {
	const client = new RestClient({ baseUrl: 'https://example.com' });

	await client.delete('/v1/rooms.cleanHistory');

	const call = lastCall();
	expect(methodOf(call)).toBe('DELETE');
	expect(bodyOf(call)).toBeUndefined();
	expect(headerOf(call, 'Content-Type')).toBeUndefined();
});

test('DELETE with a File forwards a multipart body including the file and fields', async () => {
	const client = new RestClient({ baseUrl: 'https://example.com' });
	const file = new File(['content'], 'note.txt', { type: 'text/plain' });

	await client.delete('/v1/rooms.cleanHistory', { roomId: 'abc', file });

	const call = lastCall();
	expect(methodOf(call)).toBe('DELETE');
	const body = bodyOf(call);
	expect(body).toBeInstanceOf(FormData);
	const entries = Array.from((body as FormData).entries());
	expect(entries).toEqual(
		expect.arrayContaining([
			['roomId', 'abc'],
			['file', file],
		]),
	);
});

test('DELETE returning 204 resolves to an empty object', async () => {
	fetchMock.resetMocks();
	fetchMock.doMock();
	fetchMock.mockResponse('', { status: 204 });
	const client = new RestClient({ baseUrl: 'https://example.com' });

	const result = await client.delete('/v1/rooms.cleanHistory');

	expect(result).toEqual({});
});
