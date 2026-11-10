const onCollectionCallbacks: ((data: unknown) => void)[] = [];
const subscribe = jest.fn();
let resolveConnected: () => void;

jest.mock('../lib/sdk/ddpSdk', () => ({
	getDdpSdk: () => ({
		client: {
			onCollection: (_collection: string, callback: (data: unknown) => void) => {
				onCollectionCallbacks.push(callback);
				return () => onCollectionCallbacks.splice(onCollectionCallbacks.indexOf(callback), 1);
			},
			subscribe,
		},
		connection: {
			whenConnected: () =>
				new Promise<void>((resolve) => {
					resolveConnected = resolve;
				}),
		},
	}),
}));

jest.mock('../lib/meteorRuntimeConfig', () => ({
	getClientBuild: () => ({ arch: 'web.browser', versionRefreshable: 'css-1', versionNonRefreshable: 'js-1' }),
}));

const emit = (data: unknown) => [...onCollectionCallbacks].forEach((callback) => callback(data));

describe('watchClientVersion', () => {
	const clientChanged = jest.fn();

	beforeAll(async () => {
		document.addEventListener('client_changed', clientChanged);
		await import('./watchClientVersion');
	});

	beforeEach(() => {
		clientChanged.mockClear();
	});

	it('subscribes to the client versions once the server connection is up', async () => {
		expect(subscribe).not.toHaveBeenCalled();
		resolveConnected();
		await Promise.resolve();
		await Promise.resolve();
		expect(subscribe).toHaveBeenCalledWith('meteor_autoupdate_clientVersions');
	});

	it('ignores the versions of the build this page already runs', () => {
		emit({
			msg: 'added',
			collection: 'meteor_autoupdate_clientVersions',
			id: 'web.browser',
			fields: { versionRefreshable: 'css-1', versionNonRefreshable: 'js-1' },
		});
		expect(clientChanged).not.toHaveBeenCalled();
	});

	it('ignores other client architectures', () => {
		emit({
			msg: 'changed',
			collection: 'meteor_autoupdate_clientVersions',
			id: 'web.browser.legacy',
			fields: { versionNonRefreshable: 'js-2' },
		});
		expect(clientChanged).not.toHaveBeenCalled();
	});

	it('ignores a removed version document', () => {
		emit({ msg: 'removed', collection: 'meteor_autoupdate_clientVersions', id: 'web.browser' });
		expect(clientChanged).not.toHaveBeenCalled();
	});

	it('tells the app once when the server serves a new build', () => {
		emit({ msg: 'changed', collection: 'meteor_autoupdate_clientVersions', id: 'web.browser', fields: { versionNonRefreshable: 'js-2' } });
		emit({ msg: 'changed', collection: 'meteor_autoupdate_clientVersions', id: 'web.browser', fields: { versionNonRefreshable: 'js-3' } });
		expect(clientChanged).toHaveBeenCalledTimes(1);
	});

	it('tells the app when only the stylesheets of the build change', async () => {
		await jest.isolateModulesAsync(async () => {
			await import('./watchClientVersion');
		});

		emit({ msg: 'changed', collection: 'meteor_autoupdate_clientVersions', id: 'web.browser', fields: { versionRefreshable: 'css-2' } });
		expect(clientChanged).toHaveBeenCalledTimes(1);
	});
});
