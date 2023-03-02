import { renderHook } from '@testing-library/react-hooks';
import { expect } from 'chai';
import proxyquire from 'proxyquire';

const COMPONENT_PATH = './useAutoTranslate';
const defaultConfig = {
	'@rocket.chat/ui-contexts': {
		useSetting: () => true,
	},
	'../../../../../app/autotranslate/client': {
		AutoTranslate: {
			getLanguage: () => 'lang',
		},
	},
	'../../../../lib/rooms/roomCoordinator': {
		roomCoordinator: {
			isLivechatRoom: () => false,
		},
	},
};

describe('room/MessageList/hooks/useAutoTranslate', () => {
	it('should return enabled false and undefined language if no subscription and setting disabled', () => {
		const { useAutoTranslate } = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'@rocket.chat/ui-contexts': {
				useSetting: () => false,
			},
		});

		const { result } = renderHook(() => useAutoTranslate());

		expect(result.current.autoTranslateEnabled).to.be.equal(false);
		expect(result.current.autoTranslateLanguage).to.be.undefined;

		expect(result.current.showAutoTranslate({ u: { _id: 2 } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 1 }, translations: { lang: 'translated' } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 2 }, translations: { lang: 'translated' } })).to.be.equal(false);
	});

	it('should return enabled false and undefined language if no subscription', () => {
		const { useAutoTranslate } = proxyquire.noCallThru().load(COMPONENT_PATH, defaultConfig);

		const { result } = renderHook(() => useAutoTranslate());

		expect(result.current.autoTranslateEnabled).to.be.equal(false);
		expect(result.current.autoTranslateLanguage).to.be.undefined;

		expect(result.current.showAutoTranslate({ u: { _id: 2 } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 1 }, translations: { lang: 'translated' } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 2 }, translations: { lang: 'translated' } })).to.be.equal(false);
	});

	it('should return enabled true and the auto translate language if has subscription', () => {
		const { useAutoTranslate } = proxyquire.noCallThru().load(COMPONENT_PATH, defaultConfig);

		const { result } = renderHook(() => useAutoTranslate({ autoTranslate: true, autoTranslateLanguage: 'lang', u: { _id: 1 } }));

		expect(result.current.autoTranslateEnabled).to.be.equal(true);
		expect(result.current.autoTranslateLanguage).to.be.equal('lang');

		expect(result.current.showAutoTranslate({ u: { _id: 2 } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 1 }, translations: { lang: 'translated' } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 2 }, translations: { lang: 'translated' } })).to.be.equal(true);
	});

	it('should return enabled true and the default auto translate language if is livechat room', () => {
		const { useAutoTranslate } = proxyquire.noCallThru().load(COMPONENT_PATH, {
			...defaultConfig,
			'../../../../../app/autotranslate/client': {
				AutoTranslate: {
					getLanguage: () => 'default',
				},
			},
			'../../../../lib/rooms/roomCoordinator': {
				roomCoordinator: {
					isLivechatRoom: () => true,
				},
			},
		});

		const { result } = renderHook(() => useAutoTranslate({ autoTranslate: false, autoTranslateLanguage: 'default', u: { _id: 1 } }));

		expect(result.current.autoTranslateEnabled).to.be.equal(true);
		expect(result.current.autoTranslateLanguage).to.be.equal('default');

		expect(result.current.showAutoTranslate({ u: { _id: 2 } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 1 }, translations: { default: 'translated' } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 2 }, translations: { default: 'translated' } })).to.be.equal(true);
	});

	it('should return enabled false if no auto translate language', () => {
		const { useAutoTranslate } = proxyquire.noCallThru().load(COMPONENT_PATH, defaultConfig);

		const { result } = renderHook(() => useAutoTranslate({ autoTranslate: true, autoTranslateLanguage: undefined, u: { _id: 1 } }));

		expect(result.current.autoTranslateEnabled).to.be.equal(false);
		expect(result.current.autoTranslateLanguage).to.be.equal(undefined);

		expect(result.current.showAutoTranslate({ u: { _id: 2 } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 1 }, translations: { lang: 'translated' } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 2 }, translations: { lang: 'translated' } })).to.be.equal(false);
	});

	it('should return enabled false and language undefined if auto translate is false and has auto translate language', () => {
		const { useAutoTranslate } = proxyquire.noCallThru().load(COMPONENT_PATH, defaultConfig);

		const { result } = renderHook(() => useAutoTranslate({ autoTranslate: false, autoTranslateLanguage: 'lang', u: { _id: 1 } }));

		expect(result.current.autoTranslateEnabled).to.be.equal(false);
		expect(result.current.autoTranslateLanguage).to.be.equal(undefined);

		expect(result.current.showAutoTranslate({ u: { _id: 2 } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 1 }, translations: { lang: 'translated' } })).to.be.equal(false);
		expect(result.current.showAutoTranslate({ u: { _id: 2 }, translations: { lang: 'translated' } })).to.be.equal(false);
	});
});
