import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useTranslateAction } from './useTranslateAction';
import { useViewOriginalTranslationAction } from './useViewOriginalTranslationAction';
import { createFakeMessage, createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../tests/mocks/data';
import { AutoTranslate } from '../../../lib/autotranslate';
import { Messages } from '../../../stores';

jest.mock('../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: { isLivechatRoom: (type: string) => type === 'l' },
}));

const user = createFakeUser({ _id: 'current-user-id' });
const room = createFakeRoom({ t: 'c' });
const subscription = createFakeSubscription({ autoTranslate: true, autoTranslateLanguage: 'pt' });
const translateMessage = jest.fn();

type TestMessage = IMessage & { autoTranslateShowInverse?: boolean };

const messageFrom = (overrides: Partial<TestMessage> = {}) =>
	createFakeMessage({ _id: 'message-id', u: { _id: 'other-user-id', username: 'other' }, ...overrides }) as TestMessage;

const translated = (language: string) =>
	({ translations: { [language]: 'texto' }, translationProvider: 'provider' }) as Partial<TestMessage>;

const wrapperWith = ({ setting = true, permission = true, loggedIn = true } = {}) => {
	const root = mockAppRoot()
		.withSetting('AutoTranslate_Enabled', setting)
		.withEndpoint('POST', '/v1/autotranslate.translateMessage', translateMessage);
	if (permission) {
		root.withPermission('auto-translate');
	}
	if (loggedIn) {
		root.withUser(user);
	}
	return root.build();
};

const renderTranslate = (message: TestMessage, options: { room?: IRoom; subscription?: ISubscription } = {}, wrapper = wrapperWith()) =>
	renderHook(() => useTranslateAction(message, { room, subscription, ...options }), { wrapper }).result.current;

const renderViewOriginal = (message: TestMessage, options: { room?: IRoom; subscription?: ISubscription } = {}, wrapper = wrapperWith()) =>
	renderHook(() => useViewOriginalTranslationAction(message, { room, subscription, ...options }), { wrapper }).result.current;

describe('message translation actions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		Messages.state.replaceAll([]);
		AutoTranslate.messageIdsToWait = {};
	});

	describe('useTranslateAction', () => {
		it('should offer the action on a message of another user when auto-translate is on for the room', () => {
			expect(renderTranslate(messageFrom())).toMatchObject({ id: 'translate' });
		});

		it.each([
			['the setting is off', { setting: false }],
			['the user lacks the permission', { permission: false }],
			['no user is logged in', { loggedIn: false }],
		])('should not offer the action when %s', (_case, options) => {
			expect(renderTranslate(messageFrom(), {}, wrapperWith(options))).toBeNull();
		});

		it('should not offer the action on a message of the user', () => {
			expect(renderTranslate(messageFrom({ u: { _id: user._id, username: 'me' } }))).toBeNull();
		});

		it('should not offer the action when auto-translate is off for the room', () => {
			expect(renderTranslate(messageFrom(), { subscription: createFakeSubscription({ autoTranslate: false }) })).toBeNull();
		});

		it('should offer the action in a livechat room with no auto-translate on the subscription', () => {
			const action = renderTranslate(messageFrom(), {
				room: createFakeRoom({ t: 'l' }),
				subscription: createFakeSubscription({ autoTranslate: false }),
			});

			expect(action).not.toBeNull();
		});

		it('should not offer the action when the message is already translated to the language of the user', () => {
			expect(renderTranslate(messageFrom(translated('pt')))).toBeNull();
		});

		it('should offer the action when a translation exists only in another language', () => {
			expect(renderTranslate(messageFrom(translated('es')))).not.toBeNull();
		});

		it('should not offer the action when an attachment is already translated', () => {
			const attachments = [{ translations: { pt: 'texto' } }] as unknown as IMessage['attachments'];

			expect(renderTranslate(messageFrom({ attachments }))).toBeNull();
		});

		it('should offer the action to bring the translation back on a message that shows its original', () => {
			const message = messageFrom({ ...translated('pt'), autoTranslateShowInverse: true });

			expect(renderTranslate(message)).not.toBeNull();
		});

		it('should request a translation to the language of the subscription', async () => {
			const message = messageFrom();
			Messages.state.store(message);

			renderTranslate(message)?.action(undefined as never);

			await waitFor(() => expect(translateMessage).toHaveBeenCalledWith({ messageId: 'message-id', targetLanguage: 'pt' }));
			expect(AutoTranslate.messageIdsToWait['message-id']).toBe(true);
			expect(Messages.state.get('message-id')).toMatchObject({ autoTranslateFetching: true, autoTranslateShowInverse: true });
		});

		it('should leave the other messages alone', () => {
			const message = messageFrom();
			Messages.state.store(message);
			Messages.state.store(messageFrom({ _id: 'other-message-id' }));

			renderTranslate(message)?.action(undefined as never);

			expect(Messages.state.get('other-message-id')).not.toHaveProperty('autoTranslateFetching');
			expect(Messages.state.get('other-message-id')).not.toHaveProperty('autoTranslateShowInverse');
		});

		it('should not request a translation that the message already has', () => {
			const message = messageFrom({ ...translated('pt'), autoTranslateShowInverse: true });
			Messages.state.store(message);

			renderTranslate(message)?.action(undefined as never);

			expect(translateMessage).not.toHaveBeenCalled();
			expect(Messages.state.get('message-id')).not.toHaveProperty('autoTranslateShowInverse');
		});
	});

	describe('useViewOriginalTranslationAction', () => {
		it('should offer the action on a translated message of another user', () => {
			expect(renderViewOriginal(messageFrom(translated('pt')))).toMatchObject({ id: 'view-original' });
		});

		it('should not offer the action on a message with no translation', () => {
			expect(renderViewOriginal(messageFrom())).toBeNull();
		});

		it('should not offer the action on a message that already shows its original', () => {
			expect(renderViewOriginal(messageFrom({ ...translated('pt'), autoTranslateShowInverse: true }))).toBeNull();
		});

		it('should not offer the action on a message of the user', () => {
			expect(renderViewOriginal(messageFrom({ ...translated('pt'), u: { _id: user._id, username: 'me' } }))).toBeNull();
		});

		it('should not offer the action when auto-translate is off for the room', () => {
			const options = { subscription: createFakeSubscription({ autoTranslate: false, autoTranslateLanguage: 'pt' }) };

			expect(renderViewOriginal(messageFrom(translated('pt')), options)).toBeNull();
		});

		it.each([
			['the setting is off', { setting: false }],
			['the user lacks the permission', { permission: false }],
		])('should not offer the action when %s', (_case, options) => {
			expect(renderViewOriginal(messageFrom(translated('pt')), {}, wrapperWith(options))).toBeNull();
		});

		it('should leave the other messages alone', () => {
			const message = messageFrom(translated('pt'));
			Messages.state.store(message);
			Messages.state.store(messageFrom({ _id: 'other-message-id' }));

			renderViewOriginal(message)?.action(undefined as never);

			expect(Messages.state.get('other-message-id')).not.toHaveProperty('autoTranslateShowInverse');
		});

		it('should show the original without a new translation request', () => {
			const message = messageFrom(translated('pt'));
			Messages.state.store(message);

			renderViewOriginal(message)?.action(undefined as never);

			expect(translateMessage).not.toHaveBeenCalled();
			expect(Messages.state.get('message-id')).toMatchObject({ autoTranslateShowInverse: true });
		});
	});
});
