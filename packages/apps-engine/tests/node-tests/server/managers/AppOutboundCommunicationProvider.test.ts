import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { IOutboundMessageProviders } from '../../../../src/definition/outboundComunication';
import type { ProxiedApp } from '../../../../src/server/ProxiedApp';
import { OutboundMessageProvider } from '../../../../src/server/managers/AppOutboundCommunicationProvider';

describe('OutboundMessageProvider', () => {
	it('ensureAppOutboundCommunicationProviderManager', () => {
		const mockApp = {} as ProxiedApp;

		assert.doesNotThrow(() => new OutboundMessageProvider(mockApp, {} as IOutboundMessageProviders));

		const aocp = new OutboundMessageProvider(mockApp, {} as IOutboundMessageProviders);

		assert.strictEqual(aocp.isRegistered, false);

		aocp.setRegistered(true);

		assert.strictEqual(aocp.isRegistered, true);
	});
});
