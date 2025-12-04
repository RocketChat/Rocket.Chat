import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IVideoConfProvider } from '../../../../src/definition/videoConfProviders';
import { VideoConfProviderExtend } from '../../../../src/server/accessors';
import type { AppVideoConfProviderManager } from '../../../../src/server/managers';

describe('VideoConfProviderExtend', () => {
	it('basicVideoConfProviderExtend', () => {
		assert.doesNotThrow(() => new VideoConfProviderExtend({} as AppVideoConfProviderManager, 'testing'));
	});

	it('provideProviderToVideoConfProviderExtend', async () => {
		let providerAdded: IVideoConfProvider | undefined;
		const mockManager: AppVideoConfProviderManager = {
			addProvider(appId: string, provider: IVideoConfProvider) {
				providerAdded = provider;
			},
		} as AppVideoConfProviderManager;

		const se = new VideoConfProviderExtend(mockManager, 'testing');

		const mockProvider: IVideoConfProvider = {
			name: 'test',

			async generateUrl(): Promise<string> {
				return '';
			},
			async customizeUrl(): Promise<string> {
				return '';
			},
		} as IVideoConfProvider;

		await assert.doesNotReject(() => se.provideVideoConfProvider(mockProvider));
		assert.strictEqual(providerAdded, mockProvider);
	});
});
