import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('TranslationProviderRegistry', () => {
	let TranslationProviderRegistry: any;
	let addStub: sinon.SinonStub;
	let removeStub: sinon.SinonStub;

	const message = { _id: 'msg1', rid: 'room1', msg: 'hello' } as IMessage;
	const room = { _id: 'room1' } as IRoom;

	const makeProvider = (name: string) => ({
		_getProviderMetadata: () => ({ name }),
		translateMessage: sinon.stub().resolves({ ...message, translations: { [name]: 'translated' } }),
	});

	const getRegisteredCallback = () => addStub.firstCall.args[1];

	beforeEach(() => {
		addStub = sinon.stub();
		removeStub = sinon.stub();

		({ TranslationProviderRegistry } = proxyquire
			.noCallThru()
			.noPreserveCache()
			.load('../../../../../server/lib/autotranslate/autotranslate', {
				'meteor/meteor': { Meteor: { startup: sinon.stub() } },
				'@rocket.chat/models': { Messages: {}, Subscriptions: {} },
				'../../settings': { settings: { watch: sinon.stub(), get: sinon.stub() } },
				'../callbacks': { callbacks: { add: addStub, remove: removeStub, priority: { MEDIUM: 2 } } },
				'../messaging/markdown': { Markdown: {} },
				'../notifyListener': { notifyOnMessageChange: sinon.stub() },
			}));
	});

	it('should remove the afterSaveMessage callback and not register a new one when disabled', () => {
		TranslationProviderRegistry.setEnable(false);

		expect(removeStub.calledOnceWith('afterSaveMessage', 'autotranslate')).to.be.true;
		expect(addStub.called).to.be.false;
	});

	it('should register the afterSaveMessage callback when enabled', () => {
		TranslationProviderRegistry.setEnable(true);

		expect(addStub.calledOnce).to.be.true;
		expect(addStub.firstCall.args[0]).to.equal('afterSaveMessage');
		expect(addStub.firstCall.args[3]).to.equal('autotranslate');
	});

	it('should translate with the newly selected provider after switching providers while enabled', async () => {
		const providerA = makeProvider('a');
		const providerB = makeProvider('b');
		TranslationProviderRegistry.registerProvider(providerA);
		TranslationProviderRegistry.registerProvider(providerB);

		TranslationProviderRegistry.setCurrentProvider('a');
		TranslationProviderRegistry.setEnable(true);

		const callback = getRegisteredCallback();

		await callback(message, { room });
		expect(providerA.translateMessage.calledOnce).to.be.true;

		TranslationProviderRegistry.setCurrentProvider('b');

		await callback(message, { room });
		expect(providerB.translateMessage.calledOnce).to.be.true;
		expect(providerA.translateMessage.calledOnce).to.be.true;
	});

	it('should resolve null when no provider is active, letting the callback chain keep the original message', async () => {
		TranslationProviderRegistry.setCurrentProvider('missing');
		TranslationProviderRegistry.setEnable(true);

		const result = await getRegisteredCallback()(message, { room });

		expect(result).to.be.null;
	});
});
