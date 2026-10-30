import type { IE2EEMessage, IMessage, MessageQuoteAttachment, Serialized } from '@rocket.chat/core-typings';

import { e2e } from './rocketchat.e2e';
import type { E2ERoom } from './rocketchat.e2e.room';
import { sdk } from '../SDKClient';
import { settings } from '../settings';

jest.mock('@rocket.chat/ui-client', () => ({ imperativeModal: {} }));
jest.mock('./crypto/rsa', () => ({}));
jest.mock('./helper', () => ({}));
jest.mock('./keychain', () => ({}));
jest.mock('./logger', () => ({
	createLogger: () => ({ span: () => ({ set: jest.fn().mockReturnThis(), info: jest.fn() }) }),
}));
jest.mock('./rocketchat.e2e.room', () => ({}));
jest.mock('../../stores', () => ({}));
jest.mock('../../views/e2e/EnterE2EPasswordModal', () => ({}));
jest.mock('../../views/e2e/SaveE2EPasswordModal', () => ({}));
jest.mock('../SDKClient', () => ({ sdk: { rest: { get: jest.fn() } } }));
jest.mock('../banners', () => ({}));
jest.mock('../getUserAvatarURL', () => ({ getUserAvatarURL: () => '/avatar/bob' }));
jest.mock('../sdk/ddpSdk', () => ({ getDdpSdk: () => ({ account: { onLogout: jest.fn() } }) }));
jest.mock('../sdk/storage', () => ({}));
jest.mock('../settings', () => ({ settings: { peek: jest.fn() } }));
jest.mock('../toast', () => ({}));
jest.mock('../../../lib/i18n', () => ({ t: (key: string) => key }));

const siteUrl = 'http://localhost:3000';
const quoteUrl = (id: string): string => `${siteUrl}/group/encrypted?msg=${id}`;
const makeMessage = (id: string) =>
	({
		_id: id,
		rid: 'r1',
		t: 'e2e',
		e2e: 'pending',
		msg: 'ciphertext',
		content: { algorithm: 'rc.v1.aes-sha2', ciphertext: 'ciphertext' },
		u: { _id: 'u2', username: 'bob' },
		ts: new Date('2026-10-29T12:00:00.000Z'),
		_updatedAt: new Date('2026-10-29T12:00:00.000Z'),
	}) satisfies IE2EEMessage;

const quoteAttachments = (message: IMessage): MessageQuoteAttachment[] => message.attachments as MessageQuoteAttachment[];

describe('E2E quoted message links', () => {
	let quoteChainLimit: number | undefined;
	let plainTexts: Map<string, string>;
	let decryptInRoom: jest.Mock;

	beforeEach(() => {
		quoteChainLimit = 2;
		plainTexts = new Map();
		jest.mocked(settings.peek).mockImplementation(((id: string) => {
			if (id === 'Site_Url') return siteUrl;
			if (id === 'Message_QuoteChainLimit') return quoteChainLimit;
			return undefined;
		}) as typeof settings.peek);
		decryptInRoom = jest.fn(async (message: IMessage) => ({
			...message,
			e2e: 'done',
			msg: plainTexts.get(message._id) ?? 'plain text',
		}));
		jest.spyOn(e2e, 'getInstanceByRoomId').mockResolvedValue({ decryptMessage: decryptInRoom } as unknown as E2ERoom);
		jest.mocked(sdk.rest.get).mockImplementation((async (_path: string, { msgId }: { msgId: string }) => {
			// Stop unfixed recursion before it can exhaust memory. Fetch-count assertions still detect the extra requests.
			if (jest.mocked(sdk.rest.get).mock.calls.length > 6) return { message: undefined };
			const message = makeMessage(msgId);
			return {
				message: {
					...message,
					ts: message.ts.toISOString(),
					_updatedAt: message._updatedAt.toISOString(),
				} satisfies Serialized<IMessage>,
			};
		}) as typeof sdk.rest.get);
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.clearAllMocks();
	});

	it('bounds a self-referencing quote at the configured depth', async () => {
		plainTexts.set('self', quoteUrl('self'));

		const decrypted = await e2e.decryptMessage(makeMessage('self'));

		expect(sdk.rest.get).toHaveBeenCalledTimes(2);
		expect(decryptInRoom).toHaveBeenCalledTimes(3);
		expect(quoteAttachments(decrypted)[0].text).toBe(quoteUrl('self'));
	});

	it('bounds mutually recursive quotes at the configured depth', async () => {
		plainTexts.set('first', quoteUrl('second'));
		plainTexts.set('second', quoteUrl('first'));

		await e2e.decryptMessage(makeMessage('first'));

		expect(jest.mocked(sdk.rest.get).mock.calls.map(([, params]) => params)).toEqual([{ msgId: 'second' }, { msgId: 'first' }]);
		expect(decryptInRoom).toHaveBeenCalledTimes(3);
	});

	it('uses the configured depth when no explicit depth is supplied', async () => {
		quoteChainLimit = 3;
		plainTexts.set('self', quoteUrl('self'));

		await e2e.decryptMessage(makeMessage('self'));

		expect(sdk.rest.get).toHaveBeenCalledTimes(3);
		expect(decryptInRoom).toHaveBeenCalledTimes(4);
	});

	it('defaults to two levels when the configured depth is absent', async () => {
		quoteChainLimit = undefined;
		plainTexts.set('self', quoteUrl('self'));

		await e2e.decryptMessage(makeMessage('self'));

		expect(sdk.rest.get).toHaveBeenCalledTimes(2);
	});

	it('resolves and displays the direct quote when the configured limit is zero', async () => {
		quoteChainLimit = 0;
		plainTexts.set('self', quoteUrl('self'));

		const decrypted = await e2e.decryptMessage(makeMessage('self'));

		expect(sdk.rest.get).toHaveBeenCalledTimes(1);
		expect(quoteAttachments(decrypted)).toEqual([
			expect.objectContaining({ text: quoteUrl('self'), message_link: quoteUrl('self'), attachments: [] }),
		]);
	});

	it('decrypts without fetching quotes when an explicit depth is zero', async () => {
		plainTexts.set('self', quoteUrl('self'));

		const decrypted = await e2e.decryptMessage(makeMessage('self'), { quoteDepth: 0 });

		expect(sdk.rest.get).not.toHaveBeenCalled();
		expect(decryptInRoom).toHaveBeenCalledTimes(1);
		expect(decrypted).toEqual(expect.objectContaining({ e2e: 'done', msg: quoteUrl('self') }));
		expect(decrypted.attachments).toBeUndefined();
	});

	it('preserves the display of a normal direct quote', async () => {
		plainTexts.set('reply', `See ${quoteUrl('original')}`);
		plainTexts.set('original', 'Original message');

		const decrypted = await e2e.decryptMessage(makeMessage('reply'));

		expect(sdk.rest.get).toHaveBeenCalledTimes(1);
		expect(sdk.rest.get).toHaveBeenCalledWith('/v1/chat.getMessage', { msgId: 'original' });
		expect(quoteAttachments(decrypted)).toEqual([
			{
				text: 'Original message',
				message_link: quoteUrl('original'),
				author_name: 'bob',
				author_icon: '/avatar/bob',
				attachments: [],
				ts: makeMessage('original').ts,
			},
		]);
	});
});
