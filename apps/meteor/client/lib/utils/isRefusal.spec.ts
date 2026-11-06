import { isRefusal } from './isRefusal';

// What the browser sees: the REST client rejects with the `Response`, and `RestApiClient`'s middleware replaces
// it with the body that response carried.
it('reads a refusal the app client has already unwrapped', () => {
	expect(isRefusal({ success: false, error: 'not-allowed' })).toBe(true);
});

// What a spec against the bare client sees, and what the middleware is handed before it rewrites it. Built by
// hand rather than with `new Response`, which jsdom does not provide — the guard in the subject is there for the
// same reason, so the type is stood up instead of skipping the case.
class FakeResponse {
	constructor(public status: number) {}
}

const asResponse = (status: number) => {
	const response = new FakeResponse(status);
	Object.setPrototypeOf(response, Response.prototype);
	return response;
};

describe('where Response exists', () => {
	const NativeResponse = globalThis.Response;

	beforeAll(() => {
		globalThis.Response = FakeResponse as unknown as typeof Response;
	});

	afterAll(() => {
		globalThis.Response = NativeResponse;
	});

	it('reads a refusal that is still a Response', () => {
		expect(isRefusal(asResponse(403))).toBe(true);
		expect(isRefusal(asResponse(404))).toBe(true);
	});

	// The distinction the callers are for: a server that broke while answering was still reached, but it said
	// nothing about the thing that was asked for, so it is not an answer to show someone.
	it('does not call a server error an answer', () => {
		expect(isRefusal(asResponse(500))).toBe(false);
		expect(isRefusal(asResponse(502))).toBe(false);
	});
});

// The guard that keeps every caller's error path from becoming a different error where the type is missing.
it('survives an environment with no Response at all', () => {
	expect(typeof Response).toBe('undefined');
	expect(isRefusal({ success: false })).toBe(true);
	expect(isRefusal(new Error('Failed to fetch'))).toBe(false);
});

// A request that never arrived rejects with fetch's own error, which carries neither shape.
it('does not call a request that never arrived an answer', () => {
	expect(isRefusal(new TypeError('Failed to fetch'))).toBe(false);
	expect(isRefusal(new Error('Network request failed'))).toBe(false);
});

it('is not fooled by the shapes around it', () => {
	expect(isRefusal(undefined)).toBe(false);
	expect(isRefusal(null)).toBe(false);
	expect(isRefusal('not-allowed')).toBe(false);
	// A body that says the request succeeded is not a refusal, however it came to be thrown.
	expect(isRefusal({ success: true })).toBe(false);
});
