import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import DeleteMessageConfirmModal from './DeleteMessageConfirmModal';
import type { ChatAPI } from '../../../../lib/chats/ChatAPI';

it('awaits editing cleanup after deleting the currently edited message before focusing the composer', async () => {
	const message = { _id: 'message-id', rid: 'room-id' } as IMessage;
	let finishStop: () => void = () => undefined;
	const stop = jest.fn(
		() =>
			new Promise<void>((resolve) => {
				finishStop = resolve;
			}),
	);
	const focus = jest.fn();
	const chat = {
		currentEditingMessage: { getMID: () => message._id, stop },
		composer: { focus },
		data: {
			canDeleteMessage: jest.fn().mockResolvedValue(true),
			deleteMessage: jest.fn().mockResolvedValue(undefined),
		},
	} as unknown as ChatAPI;

	render(<DeleteMessageConfirmModal message={message} chat={chat} resolve={jest.fn()} reject={jest.fn()} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Are_you_sure: 'Are you sure?',
				Yes_delete_it: 'Yes, delete it',
				You_will_not_be_able_to_recover: 'This message cannot be recovered.',
			})
			.build(),
	});

	await userEvent.click(screen.getByRole('button', { name: 'Yes, delete it' }));

	await waitFor(() => {
		expect(chat.data.deleteMessage).toHaveBeenCalledWith(message);
		expect(stop).toHaveBeenCalledWith({ messageDeleted: true });
	});
	expect(focus).not.toHaveBeenCalled();

	await act(async () => finishStop());

	await waitFor(() => expect(focus).toHaveBeenCalledTimes(1));
});
