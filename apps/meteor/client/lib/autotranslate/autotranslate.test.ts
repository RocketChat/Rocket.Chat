import { after, before, beforeEach, describe, it, mock } from 'node:test';

import type { IMessage, ISupportedLanguage, ITranslatedMessage, MessageAttachmentDefault } from '@rocket.chat/core-typings';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';
import mem from 'mem';

import { createFakeMessage, createFakeSubscription, createFakeUser } from '../../../tests/mocks/data';
import { enterModuleScope, leaveModuleScope } from '../../../tests/mocks/moduleScope';

let AutoTranslate: (typeof import('./autotranslate'))['AutoTranslate'];
let createAutoTranslateMessageStreamHandler: (typeof import('./autotranslate'))['createAutoTranslateMessageStreamHandler'];
let Messages: (typeof import('../../stores'))['Messages'];
let Subscriptions: (typeof import('../../stores'))['Subscriptions'];
let Users: (typeof import('../../stores'))['Users'];
let sdk: (typeof import('../SDKClient'))['sdk'];
let hasPermission: (typeof import('../authorization'))['hasPermission'];
let settings: (typeof import('../settings'))['settings'];
let userIdStore: (typeof import('../user'))['userIdStore'];

const mocker = new ModuleMocker(globalThis);
const mockFn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
const spyOn: ModuleMocker['spyOn'] = mocker.spyOn.bind(mocker);

const USER_ID = 'userId';
const USERNAME = 'john.doe';
const ROOM_ID = 'roomId';

const asMock = (fn: unknown) => fn as Mock<FunctionLike>;

const flushPromises = async () => {
	await Promise.resolve();
	await Promise.resolve();
};

const signInAs = ({ language }: { language?: string } = {}) => {
	Users.state.store(createFakeUser({ _id: USER_ID, username: USERNAME, language }));
	userIdStore.setState(USER_ID);
};

const mockAutoTranslateEndpoints = ({
	providers = {},
	languages = [],
}: {
	providers?: Record<string, { name: string; displayName: string }>;
	languages?: Pick<ISupportedLanguage, 'language' | 'name'>[];
} = {}) => {
	asMock(sdk.rest.get).mockImplementation(async (path: string) => {
		if (path === '/v1/autotranslate.getProviderUiMetadata') return { providers };
		if (path === '/v1/autotranslate.getSupportedLanguages') return { languages };
		throw new Error(`unexpected request to ${path}`);
	});
};

describe('AutoTranslate', () => {
	before(() => {
		enterModuleScope();
		mock.module('../SDKClient', {
			exports: {
				sdk: {
					rest: { get: mockFn<FunctionLike>() },
				},
			},
		});
		mock.module('../authorization', {
			exports: {
				hasPermission: mockFn<FunctionLike>(),
			},
		});
		mock.module('../settings', {
			exports: {
				settings: {
					peek: mockFn<FunctionLike>(),
					observe: mockFn<FunctionLike>(() => mockFn<FunctionLike>()),
				},
			},
		});
		mock.module('../../cachedStores', {
			exports: {
				PermissionsCachedStore: {
					useReady: { subscribe: mockFn<FunctionLike>(() => mockFn<FunctionLike>()) },
				},
			},
		});
		({ AutoTranslate, createAutoTranslateMessageStreamHandler } = require('./autotranslate'));
		({ Messages, Subscriptions, Users } = require('../../stores'));
		({ sdk } = require('../SDKClient'));
		({ hasPermission } = require('../authorization'));
		({ settings } = require('../settings'));
		({ userIdStore } = require('../user'));
	});

	after(leaveModuleScope);
	beforeEach(() => {
		mocker.clearAllMocks();

		asMock(settings.observe).mockReturnValue(mockFn<FunctionLike>());
		mockAutoTranslateEndpoints();

		Messages.state.replaceAll([]);
		Subscriptions.state.replaceAll([]);
		Users.state.replaceAll([]);
		userIdStore.setState(undefined);

		mem.clear(AutoTranslate.findSubscriptionByRid);

		AutoTranslate.initialized = false;
		AutoTranslate.providersMetadata = {};
		AutoTranslate.messageIdsToWait = {};
		AutoTranslate.supportedLanguages = [];
	});

	describe('getLanguage', () => {
		it('should prefer the language configured on the subscription', () => {
			signInAs({ language: 'en' });
			Subscriptions.state.store(createFakeSubscription({ rid: ROOM_ID, autoTranslateLanguage: 'fr' }));

			expect(AutoTranslate.getLanguage(ROOM_ID)).toBe('fr');
		});

		it('should fall back to the user language when the subscription has none', () => {
			signInAs({ language: 'de' });
			Subscriptions.state.store(createFakeSubscription({ rid: ROOM_ID, autoTranslateLanguage: undefined }));

			expect(AutoTranslate.getLanguage(ROOM_ID)).toBe('de');
		});

		it('should fall back to the user language when the room has no subscription', () => {
			signInAs({ language: 'de' });

			expect(AutoTranslate.getLanguage(ROOM_ID)).toBe('de');
		});

		it('should keep a regional code that is supported', () => {
			signInAs();
			AutoTranslate.supportedLanguages = [{ language: 'zh-HK', name: 'Chinese (Hong Kong)' }] as ISupportedLanguage[];
			Subscriptions.state.store(createFakeSubscription({ rid: ROOM_ID, autoTranslateLanguage: 'zh-HK' }));

			expect(AutoTranslate.getLanguage(ROOM_ID)).toBe('zh-HK');
		});

		it('should fall back to the base language when the regional code is not supported', () => {
			signInAs();
			AutoTranslate.supportedLanguages = [{ language: 'pt', name: 'Portuguese' }] as ISupportedLanguage[];
			Subscriptions.state.store(createFakeSubscription({ rid: ROOM_ID, autoTranslateLanguage: 'pt-BR' }));

			expect(AutoTranslate.getLanguage(ROOM_ID)).toBe('pt');
		});

		it('should fall back to the base language when the supported list has not loaded yet', () => {
			signInAs();
			AutoTranslate.supportedLanguages = undefined;
			Subscriptions.state.store(createFakeSubscription({ rid: ROOM_ID, autoTranslateLanguage: 'pt-BR' }));

			expect(AutoTranslate.getLanguage(ROOM_ID)).toBe('pt');
		});
	});

	describe('translateAttachments', () => {
		beforeEach(() => {
			signInAs();
		});

		it('should return attachments untouched when they are not translatable', () => {
			const attachments = [{ text: 'hello' }] as MessageAttachmentDefault[];

			expect(AutoTranslate.translateAttachments(attachments, 'fr', false)).toBe(attachments);
			expect(attachments[0].text).toBe('hello');
		});

		it('should replace the text with the translation and keep the original', () => {
			const attachments = [
				{ author_name: 'someone', text: 'hello', translations: { fr: 'bonjour' } },
			] as unknown as MessageAttachmentDefault[];

			AutoTranslate.translateAttachments(attachments, 'fr', false);

			expect(attachments[0].text).toBe('bonjour');
			expect((attachments[0] as any).translations.original).toBe('hello');
		});

		it('should keep the original text when showing the inverse translation', () => {
			const attachments = [
				{ author_name: 'someone', text: 'hello', translations: { fr: 'bonjour' } },
			] as unknown as MessageAttachmentDefault[];

			AutoTranslate.translateAttachments(attachments, 'fr', true);

			expect(attachments[0].text).toBe('hello');
		});

		it('should replace the description with the translation for the given language', () => {
			const attachments = [
				{ author_name: 'someone', description: 'a picture', translations: { fr: 'une image' } },
			] as unknown as MessageAttachmentDefault[];

			AutoTranslate.translateAttachments(attachments, 'fr', false);

			expect(attachments[0].description).toBe('une image');
		});

		it('should keep the original description when showing the inverse translation', () => {
			const attachments = [
				{ author_name: 'someone', description: 'a picture', translations: { fr: 'une image' } },
			] as unknown as MessageAttachmentDefault[];

			AutoTranslate.translateAttachments(attachments, 'fr', true);

			expect(attachments[0].description).toBe('a picture');
		});

		it('should not translate attachments authored by the current user', () => {
			const attachments = [
				{ author_name: USERNAME, text: 'hello', translations: { fr: 'bonjour' } },
			] as unknown as MessageAttachmentDefault[];

			AutoTranslate.translateAttachments(attachments, 'fr', false);

			expect(attachments[0].text).toBe('hello');
		});

		it('should leave the text alone when there is no translation for the language', () => {
			const attachments = [
				{ author_name: 'someone', text: 'hello', translations: { de: 'hallo' } },
			] as unknown as MessageAttachmentDefault[];

			AutoTranslate.translateAttachments(attachments, 'fr', false);

			expect(attachments[0].text).toBe('hello');
		});

		it('should translate nested attachments', () => {
			const attachments = [
				{
					author_name: 'someone',
					text: 'outer',
					translations: { fr: 'exterieur' },
					attachments: [{ author_name: 'someone', text: 'inner', translations: { fr: 'interieur' } }],
				},
			] as unknown as MessageAttachmentDefault[];

			AutoTranslate.translateAttachments(attachments, 'fr', false);

			expect((attachments[0] as any).attachments[0].text).toBe('interieur');
		});
	});

	describe('init', () => {
		const enableAutoTranslate = () => {
			asMock(settings.peek).mockReturnValue(true);
			asMock(hasPermission).mockReturnValue(true);
			userIdStore.setState(USER_ID);
		};

		it('should load provider metadata and supported languages when enabled, signed in and permitted', async () => {
			enableAutoTranslate();
			mockAutoTranslateEndpoints({
				providers: { google: { name: 'google', displayName: 'Google' } },
				languages: [{ language: 'fr', name: 'French' }],
			});

			AutoTranslate.init();
			await flushPromises();

			expect(sdk.rest.get).toHaveBeenCalledWith('/v1/autotranslate.getProviderUiMetadata');
			expect(AutoTranslate.providersMetadata).toEqual({ google: { name: 'google', displayName: 'Google' } });
			expect(AutoTranslate.supportedLanguages).toEqual([{ language: 'fr', name: 'French' }]);
			expect(AutoTranslate.initialized).toBe(true);
		});

		it('should not subscribe again when already initialized', () => {
			AutoTranslate.initialized = true;

			AutoTranslate.init();

			expect(settings.observe).not.toHaveBeenCalled();
		});

		it('should not request providers when the setting is disabled', () => {
			asMock(settings.peek).mockReturnValue(false);
			asMock(hasPermission).mockReturnValue(true);
			userIdStore.setState(USER_ID);

			AutoTranslate.init();

			expect(sdk.rest.get).not.toHaveBeenCalled();
		});

		it('should not request providers when there is no signed-in user', () => {
			asMock(settings.peek).mockReturnValue(true);
			asMock(hasPermission).mockReturnValue(true);
			userIdStore.setState(undefined);

			AutoTranslate.init();

			expect(sdk.rest.get).not.toHaveBeenCalled();
		});

		it('should not request providers when the user lacks the auto-translate permission', () => {
			asMock(settings.peek).mockReturnValue(true);
			asMock(hasPermission).mockReturnValue(false);
			userIdStore.setState(USER_ID);

			AutoTranslate.init();

			expect(sdk.rest.get).not.toHaveBeenCalled();
		});

		it('should not throw and should keep defaults when loading providers fails', async () => {
			enableAutoTranslate();
			asMock(sdk.rest.get).mockRejectedValue(new Error('autotranslate disabled'));
			const consoleError = spyOn(console, 'error').mockImplementation(() => undefined);

			AutoTranslate.init();
			await flushPromises();

			expect(AutoTranslate.providersMetadata).toEqual({});
			expect(consoleError).toHaveBeenCalledWith('autotranslate disabled');

			consoleError.mockRestore();
		});
	});

	describe('createAutoTranslateMessageStreamHandler', () => {
		beforeEach(() => {
			signInAs();
			asMock(settings.peek).mockReturnValue(false);
			asMock(hasPermission).mockReturnValue(false);
			userIdStore.setState(USER_ID);
		});

		const storeMessage = (overrides: Partial<ITranslatedMessage> = {}) => {
			const message = {
				...createFakeMessage<IMessage>({ rid: ROOM_ID, msg: 'hello', u: { _id: 'anotherUserId', username: 'someone' } }),
				...overrides,
			} as ITranslatedMessage;
			Messages.state.store(message);
			return message;
		};

		it('should ignore messages authored by the current user', () => {
			const handler = createAutoTranslateMessageStreamHandler();
			Subscriptions.state.store(createFakeSubscription({ rid: ROOM_ID, autoTranslate: true }));
			const message = storeMessage({ u: { _id: USER_ID, username: USERNAME } });

			handler(message);

			expect(Messages.state.get(message._id)?.autoTranslateFetching).toBeUndefined();
		});

		it('should flag an untranslated message as fetching when the subscription auto-translates', () => {
			Subscriptions.state.store(createFakeSubscription({ rid: ROOM_ID, autoTranslate: true, autoTranslateLanguage: 'fr' }));
			const handler = createAutoTranslateMessageStreamHandler();
			const message = storeMessage();

			handler(message);

			expect(Messages.state.get(message._id)?.autoTranslateFetching).toBe(true);
		});

		it('should not flag a message that already carries the translation', () => {
			Subscriptions.state.store(createFakeSubscription({ rid: ROOM_ID, autoTranslate: true, autoTranslateLanguage: 'fr' }));
			const handler = createAutoTranslateMessageStreamHandler();
			const message = storeMessage({ translations: { fr: 'bonjour' } });

			handler(message);

			expect(Messages.state.get(message._id)?.autoTranslateFetching).toBeUndefined();
		});

		it('should clear the fetching flag when auto-translate was turned off while waiting', () => {
			Subscriptions.state.store(createFakeSubscription({ rid: ROOM_ID, autoTranslate: false }));
			const handler = createAutoTranslateMessageStreamHandler();
			const message = storeMessage({ autoTranslateFetching: true });
			AutoTranslate.messageIdsToWait[message._id] = true;

			handler(message);

			expect(Messages.state.get(message._id)?.autoTranslateFetching).toBeUndefined();
			expect(AutoTranslate.messageIdsToWait[message._id]).toBeUndefined();
		});

		it('should clear a stale fetching flag when the room has no auto-translating subscription', () => {
			const handler = createAutoTranslateMessageStreamHandler();
			const message = storeMessage({ autoTranslateFetching: true });

			handler(message);

			expect(Messages.state.get(message._id)?.autoTranslateFetching).toBeUndefined();
		});
	});
});
