import { Expect, SetupFixture, Test } from 'alsatian';

import type { IOutboundMessageProviders } from '../../../src/definition/outboundComunication';
import type { ProxiedApp } from '../../../src/server/ProxiedApp';
import { OutboundMessageProvider } from '../../../src/server/managers/AppOutboundCommunicationProvider';

export class AppOutboundCommunicationProviderTestFixture {
	private mockApp: ProxiedApp;

	@SetupFixture
	public setupFixture() {
		this.mockApp = {} as ProxiedApp;
	}

	@Test()
	public ensureAppOutboundCommunicationProviderManager() {
		Expect(() => new OutboundMessageProvider(this.mockApp, {} as IOutboundMessageProviders)).not.toThrow();

		const aocp = new OutboundMessageProvider(this.mockApp, {} as IOutboundMessageProviders);

		Expect(aocp.isRegistered).toBe(false);

		aocp.setRegistered(true);

		Expect(aocp.isRegistered).toBe(true);
	}
}
