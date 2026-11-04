const clearStoredCredentials = jest.fn();
let mockLoginToken = 'token';

jest.mock('./sdk/ddpSdk', () => ({ clearStoredCredentials }));
jest.mock('./sdk/storage', () => ({
	STORAGE_KEYS: { USER_ID: 'Meteor.userId', LOGIN_TOKEN: 'Meteor.loginToken' },
	getStoredItem: (key: string) => (key === 'Meteor.loginToken' ? mockLoginToken : 'user-id'),
}));
jest.mock('./2fa/process2faReturn', () => ({ invokeTwoFactorModal: jest.fn() }));
jest.mock('./baseURI', () => ({ baseURI: 'http://localhost:3000/' }));

// jsdom has no fetch Response; this covers what the REST client reads from one.
class FakeResponse {
	readonly ok: boolean;

	constructor(
		private readonly body: unknown,
		readonly status: number,
	) {
		this.ok = status >= 200 && status < 300;
	}

	async json() {
		return this.body;
	}

	clone() {
		return this;
	}
}

(globalThis as any).Response = FakeResponse;

const respond = (status: number, body: unknown) => {
	globalThis.fetch = jest.fn(async () => new FakeResponse(body, status) as unknown as Response);
};

const sessionRejected = {
	success: false,
	error: 'You must be logged in to do this.',
	status: 'error',
	message: 'You must be logged in to do this.',
};

describe('APIClient', () => {
	let APIClient: typeof import('./RestApiClient').APIClient;

	beforeAll(async () => {
		({ APIClient } = await import('./RestApiClient'));
	});

	beforeEach(() => {
		clearStoredCredentials.mockClear();
		mockLoginToken = 'token';
	});

	it('ends the session when a mutation is rejected for its token', async () => {
		respond(401, sessionRejected);
		await expect(APIClient.post('/v1/rooms.hide' as any, { roomId: 'room' } as any)).rejects.toMatchObject({
			error: sessionRejected.error,
		});
		expect(clearStoredCredentials).toHaveBeenCalledTimes(1);
	});

	it('ends the session when an endpoint answers the rejection in `message` only', async () => {
		respond(401, { status: 'error', message: sessionRejected.message });
		await expect(APIClient.post('/v1/rooms.hide' as any, { roomId: 'room' } as any)).rejects.toMatchObject({
			message: sessionRejected.message,
		});
		expect(clearStoredCredentials).toHaveBeenCalledTimes(1);
	});

	it('keeps the session of a re-login that happened while the mutation was in flight', async () => {
		globalThis.fetch = jest.fn(async () => {
			mockLoginToken = 'new-token';
			return new FakeResponse(sessionRejected, 401) as unknown as Response;
		});
		await expect(APIClient.post('/v1/rooms.hide' as any, { roomId: 'room' } as any)).rejects.toMatchObject({
			error: sessionRejected.error,
		});
		expect(clearStoredCredentials).not.toHaveBeenCalled();
	});

	it('keeps the session when an endpoint answers 401 for its own reason', async () => {
		respond(401, { success: false, error: 'unauthorized' });
		await expect(APIClient.post('/v1/rooms.hide' as any, { roomId: 'room' } as any)).rejects.toMatchObject({ error: 'unauthorized' });
		expect(clearStoredCredentials).not.toHaveBeenCalled();
	});

	it('keeps the session when a read is rejected', async () => {
		respond(401, sessionRejected);
		await expect(APIClient.get('/v1/custom-sounds.list' as any)).rejects.toMatchObject({ error: sessionRejected.error });
		expect(clearStoredCredentials).not.toHaveBeenCalled();
	});

	it('keeps the session on a forbidden answer', async () => {
		respond(403, { success: false, error: 'error-not-allowed' });
		await expect(APIClient.post('/v1/rooms.hide' as any, { roomId: 'room' } as any)).rejects.toMatchObject({ error: 'error-not-allowed' });
		expect(clearStoredCredentials).not.toHaveBeenCalled();
	});
});
