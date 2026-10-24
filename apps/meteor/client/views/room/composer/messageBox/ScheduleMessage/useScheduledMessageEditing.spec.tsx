import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { scheduledMessageEditing, useScheduledMessageEditing } from './useScheduledMessageEditing';
import type { ComposerAPI } from '../../../../../lib/chats/ChatAPI';

const update = jest.fn();
const sendNew = jest.fn();

const appRoot = () =>
	mockAppRoot()
		.withJohnDoe()
		.withTranslations('en', 'core', { Send_now: 'Send now', Discard: 'Discard' })
		.withEndpoint('POST', '/v1/scheduledMessages.update', (params) => update(params))
		.withEndpoint('GET', '/v1/scheduledMessages.list', () => ({ scheduledMessages: [], total: 0, offset: 0, count: 0 }))
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

describe('useScheduledMessageEditing', () => {
	beforeEach(() => {
		update.mockReset();
		sendNew.mockReset();
		scheduledMessageEditing.stop({ rid: 'rid' });
		scheduledMessageEditing.stop({ rid: 'rid', tmid: 'parent' });
	});

	it('loads the scheduled text into the composer of its room', async () => {
		const target = composer();
		renderHook(() => useScheduledMessageEditing('rid', undefined, target, sendNew), { wrapper: appRoot() });

		act(() => scheduledMessageEditing.start({ rid: 'rid' }, { scheduledMessageId: 's1', msg: 'draft text' }));

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

	it('saves the edited text and leaves editing', async () => {
		update.mockResolvedValue({ scheduledMessage: { _id: 's1' } });
		const target = composer();
		const { result } = renderHook(() => useScheduledMessageEditing('rid', undefined, target, sendNew), { wrapper: appRoot() });
		act(() => scheduledMessageEditing.start({ rid: 'rid' }, { scheduledMessageId: 's1', msg: 'draft text' }));

		await act(() => result.current.save('final text'));

		expect(update).toHaveBeenCalledWith({ scheduledMessageId: 's1', msg: 'final text' });
		expect(target.clear).toHaveBeenCalled();
		expect(result.current.editing).toBeUndefined();
	});

	it('puts the held files into the composer attachments, so they are removed and captioned like any other', async () => {
		global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['png']) });
		const target = composer();
		renderHook(() => useScheduledMessageEditing('rid', undefined, target, sendNew), { wrapper: appRoot() });

		act(() =>
			scheduledMessageEditing.start(
				{ rid: 'rid' },
				{ scheduledMessageId: 's1', msg: 'draft text', files: [{ _id: 'f1', name: 'a.png', type: 'image/png', description: 'a cat' }] },
			),
		);

		await waitFor(() =>
			expect(target.uploads.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'f1', percentage: 100, altText: 'a cat' })),
		);
		expect(target.uploads.clear).toHaveBeenCalled();
		expect(target.uploads.add.mock.calls[0][0].file).toMatchObject({ name: 'a.png', type: 'image/png', size: 3 });
	});

	it('loads only the files of the message being edited when the user switches before they arrive', async () => {
		const pending: (() => void)[] = [];
		global.fetch = jest.fn(() => new Promise<Response>((resolve) => pending.push(() => resolve({ ok: false } as Response))));
		const target = composer();
		renderHook(() => useScheduledMessageEditing('rid', undefined, target, sendNew), { wrapper: appRoot() });

		act(() =>
			scheduledMessageEditing.start({ rid: 'rid' }, { scheduledMessageId: 's1', msg: 'one', files: [{ _id: 'f1', name: 'a.png' }] }),
		);
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
		const { result } = renderHook(() => useScheduledMessageEditing('rid', undefined, target, sendNew), { wrapper: appRoot() });
		act(() =>
			scheduledMessageEditing.start(
				{ rid: 'rid' },
				{
					scheduledMessageId: 's1',
					msg: 'draft text',
					files: [
						{ _id: 'f1', name: 'a.png' },
						{ _id: 'f2', name: 'b.pdf' },
					],
				},
			),
		);

		target.uploads.clear.mockClear();
		await act(() => result.current.save('final text'));

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

	it('keeps the text and offers to send it as new when the message was already sent', async () => {
		update.mockRejectedValue(Object.assign(new Error('not found'), { error: 'error-scheduled-message-not-found' }));
		const target = composer();
		const { result } = renderHook(() => useScheduledMessageEditing('rid', undefined, target, sendNew), { wrapper: appRoot() });
		act(() =>
			scheduledMessageEditing.start({ rid: 'rid' }, { scheduledMessageId: 's1', msg: 'draft text', files: [{ _id: 'f1', name: 'a.png' }] }),
		);

		await act(() => result.current.save('final text'));
		expect(target.clear).not.toHaveBeenCalled();
		expect(target.uploads.removeUpload).toHaveBeenCalledWith('f1');

		await userEvent.click(await screen.findByRole('button', { name: 'Send now' }));

		expect(sendNew).toHaveBeenCalledWith('final text');
	});
});
