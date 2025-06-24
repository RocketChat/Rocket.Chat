import type {
	IOutboundEmailMessageProvider,
	IOutboundPhoneMessageProvider,
} from '@rocket.chat/apps-engine/definition/outboundComunication';
import { expect } from 'chai';
import sinon from 'sinon';

import { OutboundMessageProvider } from '../../../../server/lib/OutboundMessageProvider';

describe('OutboundMessageProvider', () => {
	let outboundMessageProvider: OutboundMessageProvider;

	beforeEach(() => {
		outboundMessageProvider = new OutboundMessageProvider();
	});

	it('should successfully register a phone provider', () => {
		const phoneProvider: IOutboundPhoneMessageProvider = {
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

	it('should successfully register a email provider', () => {
		const emailProvider: IOutboundEmailMessageProvider = {
			type: 'email',
			appId: '123',
			name: 'Test Email Provider',
			sendOutboundMessage: sinon.stub(),
		};

		outboundMessageProvider.registerEmailProvider(emailProvider);

		const providers = outboundMessageProvider.getOutboundMessageProviders('email');

		expect(providers).to.have.lengthOf(1);
		expect(providers[0]).to.deep.equal(emailProvider);
	});

	it('should list currently registered providers [unfiltered]', () => {
		const phoneProvider: IOutboundPhoneMessageProvider = {
			type: 'phone',
			appId: '123',
			name: 'Test Phone Provider',
			sendOutboundMessage: sinon.stub(),
			getProviderMetadata: sinon.stub(),
		};

		const emailProvider: IOutboundEmailMessageProvider = {
			type: 'email',
			appId: '123',
			name: 'Test Email Provider',
			sendOutboundMessage: sinon.stub(),
		};

		outboundMessageProvider.registerPhoneProvider(phoneProvider);
		outboundMessageProvider.registerEmailProvider(emailProvider);

		const providers = outboundMessageProvider.getOutboundMessageProviders();

		expect(providers).to.have.lengthOf(2);
		expect(providers.some((provider) => provider.type === 'phone')).to.be.true;
		expect(providers.some((provider) => provider.type === 'email')).to.be.true;
	});

	it('should list currently registered providers [filtered by type]', () => {
		const phoneProvider: IOutboundPhoneMessageProvider = {
			type: 'phone',
			appId: '123',
			name: 'Test Phone Provider',
			sendOutboundMessage: sinon.stub(),
			getProviderMetadata: sinon.stub(),
		};

		const emailProvider: IOutboundEmailMessageProvider = {
			type: 'email',
			appId: '123',
			name: 'Test Email Provider',
			sendOutboundMessage: sinon.stub(),
		};

		outboundMessageProvider.registerPhoneProvider(phoneProvider);
		outboundMessageProvider.registerEmailProvider(emailProvider);

		const providers = outboundMessageProvider.getOutboundMessageProviders('phone');

		expect(providers).to.have.lengthOf(1);
		expect(providers[0].type).to.equal('phone');
	});

	it('should unregister a provider', () => {
		const phoneProvider: IOutboundPhoneMessageProvider = {
			type: 'phone',
			appId: '123',
			name: 'Test Phone Provider',
			sendOutboundMessage: sinon.stub(),
			getProviderMetadata: sinon.stub(),
		};

		const phoneProvider2: IOutboundPhoneMessageProvider = {
			type: 'phone',
			appId: '456',
			name: 'Test Phone Provider 2',
			sendOutboundMessage: sinon.stub(),
			getProviderMetadata: sinon.stub(),
		};

		outboundMessageProvider.registerPhoneProvider(phoneProvider);
		outboundMessageProvider.registerPhoneProvider(phoneProvider2);

		let registeredProviders = outboundMessageProvider.getOutboundMessageProviders('phone');

		expect(registeredProviders).to.have.lengthOf(2);

		outboundMessageProvider.unregisterProvider('123', 'phone');

		registeredProviders = outboundMessageProvider.getOutboundMessageProviders('phone');

		expect(registeredProviders).to.have.lengthOf(1);
		expect(registeredProviders.some((provider) => provider.appId !== '123')).to.be.true;
	});
});
