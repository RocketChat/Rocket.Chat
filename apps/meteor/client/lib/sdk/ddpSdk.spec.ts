import { DDPSDK } from '@rocket.chat/ddp-client';

jest.mock('@rocket.chat/ddp-client', () => ({
	DDPSDK: {
		create: jest.fn(() => ({
			connection: { status: 'connecting', connect: () => new Promise(() => undefined) },
			account: { loginWithToken: jest.fn(), emit: jest.fn() },
		})),
	},
}));

const loadDdpSdk = (): typeof import('./ddpSdk') => {
	let module: typeof import('./ddpSdk') | undefined;
	jest.isolateModules(() => {
		module = jest.requireActual('./ddpSdk');
	});
	return module as typeof import('./ddpSdk');
};

describe('ddpSdk', () => {
	afterEach(() => {
		document.head.querySelector('base')?.remove();
		delete (globalThis as { __meteor_runtime_config__?: unknown }).__meteor_runtime_config__;
	});

	it('should connect the websocket to the page origin instead of Site_Url', () => {
		Object.assign(globalThis, { __meteor_runtime_config__: { ROOT_URL: 'https://site-url.example/' } });
		const base = document.createElement('base');
		base.href = 'https://chat.example/workspace/';
		document.head.append(base);

		loadDdpSdk();

		expect(DDPSDK.create).toHaveBeenLastCalledWith('wss://chat.example/workspace', expect.anything());
	});

	describe('isAuthError', () => {
		it.each([[{ status: 401 }], [{ status: 403 }], [{ statusCode: 401 }], [{ statusCode: 403 }]])(
			'should treat a REST failure with %j as a refused session',
			(error) => {
				expect(loadDdpSdk().isAuthError(error)).toBe(true);
			},
		);

		it.each([[{ status: 500 }], [{ statusCode: 404 }]])('should not treat a REST failure with %j as a refused session', (error) => {
			expect(loadDdpSdk().isAuthError(error)).toBe(false);
		});
	});
});
