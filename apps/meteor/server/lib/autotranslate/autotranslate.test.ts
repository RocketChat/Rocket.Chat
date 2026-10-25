import { beforeEach, describe, it } from 'node:test';

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
			.load('./autotranslate', {
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

describe('AutoTranslate.tokenizeMentions', () => {
	const { AutoTranslate } = proxyquire.noCallThru().load('./autotranslate', {
		'meteor/meteor': { Meteor: { startup: sinon.stub() } },
		'@rocket.chat/models': { Messages: {}, Subscriptions: {} },
		'../../settings': { settings: { watch: sinon.stub(), get: sinon.stub() } },
		'../callbacks': { callbacks: { add: sinon.stub(), remove: sinon.stub(), priority: { MEDIUM: 2 } } },
		'../messaging/markdown': { Markdown: {} },
		'../notifyListener': { notifyOnMessageChange: sinon.stub() },
	});

	class TestAutoTranslate extends AutoTranslate {}

	const tokenize = (message: Partial<IMessage>) =>
		new (TestAutoTranslate as any)().tokenizeMentions({ tokens: [], ...message } as IMessage) as IMessage;

	const tokenTexts = (message: IMessage) => (message.tokens ?? []).map(({ text }) => text).sort();

	it('should protect each mention whole when one username starts with another', () => {
		const message = tokenize({
			msg: 'hi @john and @jo',
			mentions: [
				{ _id: 'a', username: 'jo' },
				{ _id: 'b', username: 'john' },
			],
		});

		expect(tokenTexts(message)).to.deep.equal(['@jo', '@john']);
		expect(message.msg).to.not.include('hn');
	});

	it('should match dots in a mentioned username literally', () => {
		const message = tokenize({ msg: 'hi @johnxdoe', mentions: [{ _id: 'a', username: 'john.doe' }] });

		expect(tokenTexts(message)).to.deep.equal([]);
		expect(message.msg).to.equal('hi @johnxdoe');
	});

	it('should protect each channel whole when one channel name starts with another', () => {
		const message = tokenize({
			msg: 'see #dev-ops and #dev',
			channels: [
				{ _id: 'a', name: 'dev' },
				{ _id: 'b', name: 'dev-ops' },
			],
		});

		expect(tokenTexts(message)).to.deep.equal(['#dev', '#dev-ops']);
		expect(message.msg).to.not.include('-ops');
	});
});
