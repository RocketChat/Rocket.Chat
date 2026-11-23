import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { scheduledMessageEditing, useScheduledMessageEditing } from './useScheduledMessageEditing';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';

const update = jest.fn();
const sendNew = jest.fn();
const mockBeforeSend = jest.fn();

jest.mock('../../../../../lib/onClientBeforeSendMessage', () => ({
	onClientBeforeSendMessage: (message: unknown) => mockBeforeSend(message),
}));

const appRoot = () =>
	mockAppRoot()
		.withJohnDoe()
		.withTranslations('en', 'core', { Send_now: 'Send now', Discard: 'Discard' })
		.withExperimentalEndpoint('POST', '/experimental/scheduledMessages.update', (params) => update(params))
		.build();

const composer = (uploads: unknown[] = []) =>
	({
		text: '',
		setText: jest.fn(),
		clear: jest.fn(),
		setCursorToEnd: jest.fn(),
		uploads: { get: () => uploads, clear: jest.fn(), add: jest.fn(), removeUpload: jest.fn() },
	}) as unknown as ComposerAPI & {
		setText: jest.Mock;
		clear: jest.Mock;
		uploads: { clear: jest.Mock; add: jest.Mock; removeUpload: jest.Mock };
	};

type Edit = Parameters<typeof scheduledMessageEditing.start>[1];

const startEditing = (edit: Edit, target = composer()) => {
	const view = renderHook(() => useScheduledMessageEditing('rid', undefined, target, sendNew), { wrapper: appRoot() });
	act(() => scheduledMessageEditing.start({ rid: 'rid' }, edit));
	return view;
};

const send = async (result: { current: ReturnType<typeof useScheduledMessageEditing> }, text: string) => {
	act(() => {
		result.current.handleSend(text);
	});
	await waitFor(() => expect(update).toHaveBeenCalled());
};

describe('useScheduledMessageEditing', () => {
	const { fetch } = global;

	afterEach(() => {
		global.fetch = fetch;
	});

	beforeEach(() => {
		global.fetch = jest.fn().mockResolvedValue({ ok: false });
		update.mockReset();
		mockBeforeSend.mockReset().mockImplementation(async (message) => message);
		sendNew.mockReset();
		scheduledMessageEditing.stop({ rid: 'rid' });
		scheduledMessageEditing.stop({ rid: 'rid', tmid: 'parent' });
	});

	it('loads the scheduled text into the composer of its room', async () => {
		const target = composer();
		startEditing({ scheduledMessageId: 's1', msg: 'draft text' }, target);

		await waitFor(() => expect(target.setText).toHaveBeenCalledWith('draft text'));
	});

	it('loads a thread reply only into the composer of that thread', async () => {
		const room = composer();
		const thread = composer();
		renderHook(() => useScheduledMessageEditing('rid', undefined, room, sendNew), { wrapper: appRoot() });
		renderHook(() => useScheduledMessageEditing('rid', 'parent', thread, sendNew), { wrapper: appRoot() });

		act(() => scheduledMessageEditing.start({ rid: 'rid', tmid: 'parent' }, { scheduledMessageId: 's1', msg: 'thread reply' }));

		await waitFor(() => expect(thread.setText).toHaveBeenCalledWith('thread reply'));
		expect(room.setText).not.toHaveBeenCalled();
	});

	it('saves the edited text, leaves editing and gives back the text the user was writing', async () => {
		update.mockResolvedValue({ scheduledMessage: { _id: 's1' } });
		const target = Object.assign(composer(), { text: 'unsent draft' });
		const { result } = startEditing({ scheduledMessageId: 's1', msg: 'scheduled text' }, target);

		await send(result, 'final text');

		expect(update).toHaveBeenCalledWith({ scheduledMessageId: 's1', msg: 'final text' });
		await waitFor(() => expect(result.current.editing).toBeUndefined());
		expect(target.clear).toHaveBeenCalled();
		expect(target.setText).toHaveBeenLastCalledWith('unsent draft');
	});

	it('saves once when the user presses Enter twice, so the second save does not wipe the restored draft', async () => {
		let resolveUpdate: (value: unknown) => void = () => undefined;
		update.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveUpdate = resolve;
				}),
		);
		const target = Object.assign(composer(), { text: 'unsent draft' });
		const { result } = startEditing({ scheduledMessageId: 's1', msg: 'scheduled text' }, target);

		await send(result, 'final text');
		act(() => {
			result.current.handleSend('final text');
		});
		await act(async () => resolveUpdate({ scheduledMessage: { _id: 's1' } }));

		await waitFor(() => expect(result.current.editing).toBeUndefined());
		expect(update).toHaveBeenCalledTimes(1);
		expect(target.setText).toHaveBeenLastCalledWith('unsent draft');
	});

	it('does not save a slash command and keeps editing', () => {
		const { result } = startEditing({ scheduledMessageId: 's1', msg: 'scheduled text' });

		act(() => {
			result.current.handleSend('/leave');
		});

		expect(update).not.toHaveBeenCalled();
		expect(result.current.editing).toBeDefined();
	});

	it('gives back the text the user was writing after the composer was remounted', () => {
		const first = Object.assign(composer(), { text: 'unsent draft' });
		startEditing({ scheduledMessageId: 's1', msg: 'scheduled text' }, first).unmount();

		const second = Object.assign(composer(), { text: 'scheduled text' });
		const { result } = renderHook(() => useScheduledMessageEditing('rid', undefined, second, sendNew), { wrapper: appRoot() });
		act(() => {
			result.current.handleClose({ preventDefault: jest.fn() });
		});

		expect(second.setText).toHaveBeenLastCalledWith('unsent draft');
	});

	it('does not give back an upload that was still running when editing started', () => {
		const target = composer([
			{ id: 'done', url: '/file', file: { name: 'a.png' } },
			{ id: 'running', percentage: 40, file: { name: 'b.png' } },
		]);
		const { result } = startEditing({ scheduledMessageId: 's1', msg: 'scheduled text' }, target);

		act(() => {
			result.current.handleClose({ preventDefault: jest.fn() });
		});

		expect(target.uploads.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'done' }));
		expect(target.uploads.add).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'running' }));
	});

	it('saves the edit of an encrypted message as ciphertext only', async () => {
		update.mockResolvedValue({ scheduledMessage: { _id: 's1' } });
		mockBeforeSend.mockImplementation(async (message) => ({
			...message,
			t: 'e2e',
			content: { algorithm: 'rc.v2.aes-sha2', kid: 'k1', iv: 'iv', ciphertext: 'secret' },
		}));
		const { result } = startEditing({ scheduledMessageId: 's1', msg: 'draft text' });

		await send(result, 'final text');

		expect(update).toHaveBeenCalledWith({
			scheduledMessageId: 's1',
			content: { algorithm: 'rc.v2.aes-sha2', kid: 'k1', iv: 'iv', ciphertext: 'secret' },
		});
	});

	it('puts the held files into the composer attachments, so they are removed and captioned like any other', async () => {
		global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['png']) });
		const target = composer();
		startEditing(
			{ scheduledMessageId: 's1', msg: 'draft text', files: [{ _id: 'f1', name: 'a.png', type: 'image/png', description: 'a cat' }] },
			target,
		);

		await waitFor(() =>
			expect(target.uploads.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'f1', percentage: 100, altText: 'a cat' })),
		);
		expect(target.uploads.clear).toHaveBeenCalled();
		expect(target.uploads.add.mock.calls[0][0].file).toMatchObject({ name: 'a.png', type: 'image/png', size: 3 });
	});

	it('keeps the held files when the edit is saved before they finish loading', async () => {
		global.fetch = jest.fn(() => new Promise<Response>(() => undefined));
		update.mockResolvedValue({ scheduledMessage: { _id: 's1' } });
		const { result } = startEditing({ scheduledMessageId: 's1', msg: 'one', files: [{ _id: 'f1', name: 'a.png' }] });

		await send(result, 'final text');

		expect(update).toHaveBeenCalledWith({ scheduledMessageId: 's1', msg: 'final text' });
	});

	it('loads only the files of the message being edited when the user switches before they arrive', async () => {
		const pending: (() => void)[] = [];
		global.fetch = jest.fn(() => new Promise<Response>((resolve) => pending.push(() => resolve({ ok: false } as Response))));
		const target = composer();
		startEditing({ scheduledMessageId: 's1', msg: 'one', files: [{ _id: 'f1', name: 'a.png' }] }, target);
		act(() =>
			scheduledMessageEditing.start({ rid: 'rid' }, { scheduledMessageId: 's2', msg: 'two', files: [{ _id: 'f2', name: 'b.png' }] }),
		);
		await act(async () => pending.forEach((respond) => respond()));

		await waitFor(() => expect(target.uploads.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'f2' })));
		expect(target.uploads.add).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'f1' }));
	});

	it('saves the attachments left in the composer as the files of the scheduled message', async () => {
		update.mockResolvedValue({ scheduledMessage: { _id: 's1' } });
		const target = composer([
			{ id: 'f1', url: '/file', file: { name: 'a.png' } },
			{ id: 'f3', url: '/file', file: { name: 'c.txt' } },
		]);
		const { result } = startEditing(
			{
				scheduledMessageId: 's1',
				msg: 'draft text',
				files: [
					{ _id: 'f1', name: 'a.png' },
					{ _id: 'f2', name: 'b.pdf' },
				],
			},
			target,
		);

		await waitFor(() => expect(target.uploads.add).toHaveBeenCalledTimes(2));
		target.uploads.clear.mockClear();
		await send(result, 'final text');

		expect(update).toHaveBeenCalledWith({
			scheduledMessageId: 's1',
			msg: 'final text',
			files: [
				{ _id: 'f1', name: 'a.png' },
				{ _id: 'f3', name: 'c.txt' },
			],
		});
		expect(target.uploads.clear).toHaveBeenCalled();
	});

	it('keeps the text, offers to send it as new when the message was already sent, then gives back the draft', async () => {
		update.mockRejectedValue(Object.assign(new Error('not found'), { error: 'error-scheduled-message-not-found' }));
		const target = Object.assign(composer(), { text: 'unsent draft' });
		const { result } = startEditing({ scheduledMessageId: 's1', msg: 'draft text', files: [{ _id: 'f1', name: 'a.png' }] }, target);

		await send(result, 'final text');
		await waitFor(() => expect(target.uploads.removeUpload).toHaveBeenCalledWith('f1'));
		expect(target.clear).not.toHaveBeenCalled();

		await userEvent.click(await screen.findByRole('button', { name: 'Send now' }));

		expect(sendNew).toHaveBeenCalledWith('final text');
		await waitFor(() => expect(target.setText).toHaveBeenLastCalledWith('unsent draft'));
	});
});
