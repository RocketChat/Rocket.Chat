import type { OutboundComms } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import { OutboundMessageProvider } from '../../../../server/lib/OutboundMessageProvider';

describe.only('OutboundMessageProvider', () => {
	let outboundMessageProvider: OutboundMessageProvider;

	beforeEach(() => {
		outboundMessageProvider = new OutboundMessageProvider();
	});

	it('should successfully register a phone provider', () => {
		const phoneProvider: OutboundComms.IOutboundMessagePhoneProvider = {
			type: 'phone',
			appId: '123',
			name: 'Test Phone Provider',
			sendOutboundMessage: sinon.stub(),
			getProviderMetadata: sinon.stub(),
		};

		outboundMessageProvider.registerPhoneProvider(phoneProvider);

		const providers = outboundMessageProvider.getOutboundMessageProviders('phone');
		expect(providers).to.have.lengthOf(1);
		expect(providers[0]).to.deep.equal(phoneProvider);
	});

	it.skip('should successfully register a email provider');
	it.skip('should list currently registered providers [unfiltered]');
	it.skip('should list currently registered providers [filtered by type]');
	it.skip('should unregister a provider');
});
