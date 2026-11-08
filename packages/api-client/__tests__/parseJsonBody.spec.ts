import { InvalidResponseError, RestClient } from '../src';

const makeResponse = (overrides: { status?: number; json: () => Promise<unknown> }) =>
	({
		ok: true,
		status: 200,
		...overrides,
	}) as unknown as Response;

describe('RestClient response body validation', () => {
	const originalFetch = global.fetch;
	let client: RestClient;

	const mockFetch = (response: Response) => {
		global.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
	};

	beforeEach(() => {
		client = new RestClient({ baseUrl: 'http://localhost:3000' });
	});

	afterEach(() => {
		global.fetch = originalFetch;
	});

	it('returns the parsed body when it is a JSON object', async () => {
		mockFetch(makeResponse({ json: async () => ({ success: true }) }));

		await expect((client as any).get('/v1/info')).resolves.toEqual({ success: true });
	});

	it('throws InvalidResponseError when the body is not valid JSON', async () => {
		mockFetch(
			makeResponse({
				json: async () => {
					throw new SyntaxError('Unexpected token');
				},
			}),
		);

		await expect((client as any).get('/v1/info')).rejects.toBeInstanceOf(InvalidResponseError);
	});

	it('returns the parsed body as-is when it is not a JSON object', async () => {
		mockFetch(makeResponse({ json: async () => true }));
		await expect((client as any).delete('/v1/info')).resolves.toBe(true);

		mockFetch(makeResponse({ json: async () => [] }));
		await expect((client as any).get('/v1/info')).resolves.toEqual([]);
	});

	it('returns an empty object for a 204 response without reading the body', async () => {
		const json = jest.fn();
		mockFetch(makeResponse({ status: 204, json }));

		await expect((client as any).post('/v1/info', {})).resolves.toEqual({});
		expect(json).not.toHaveBeenCalled();
	});

	it('rethrows errors that are not JSON syntax errors', async () => {
		const abortError = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' });
		mockFetch(
			makeResponse({
				json: async () => {
					throw abortError;
				},
			}),
		);

		await expect((client as any).get('/v1/info')).rejects.toBe(abortError);
	});

	it('does not treat a 204 response as an empty object for get', async () => {
		mockFetch(
			makeResponse({
				status: 204,
				json: async () => {
					throw new SyntaxError('Unexpected end of JSON input');
				},
			}),
		);

		await expect((client as any).get('/v1/info')).rejects.toBeInstanceOf(InvalidResponseError);
	});
});
