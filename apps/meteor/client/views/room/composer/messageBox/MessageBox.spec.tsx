import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MessageBox from './MessageBox';
import type { createComposerAPI } from './createComposerAPI';
import type { ChatAPI } from '../../../../lib/chats/ChatAPI';
import { useFileUpload } from '../../body/hooks/useFileUpload';
import { useChat } from '../../contexts/ChatContext';
import { useComposerPopupOptions } from '../../contexts/ComposerPopupContext';
import { useRoom, useRoomSubscription } from '../../contexts/RoomContext';

jest.mock('../../../../lib/rooms/roomCoordinator', () => ({
	roomCoordinator: { getRoomDirectives: () => ({ canSendMessage: () => true }) },
}));
jest.mock('../../../../lib/getURL', () => ({ getURL: (url: string) => url }));
jest.mock('../../hooks/useE2EERoomState', () => ({ useE2EERoomState: jest.fn() }));
jest.mock('../../contexts/ChatContext', () => ({ useChat: jest.fn() }));
jest.mock('../../contexts/RoomContext', () => ({ useRoom: jest.fn(), useRoomSubscription: jest.fn() }));
jest.mock('../../contexts/ComposerPopupContext', () => ({ useComposerPopupOptions: jest.fn() }));
jest.mock('../../body/hooks/useFileUpload', () => ({ useFileUpload: jest.fn() }));

const createChatStub = () => {
	const chat = {
		composer: undefined as ReturnType<typeof createComposerAPI> | undefined,
		setComposerAPI: (composer?: ReturnType<typeof createComposerAPI>) => {
			chat.composer?.release();
			chat.composer = composer;
		},
		currentEditingMessage: { getMID: () => undefined },
		action: { start: jest.fn(), stop: jest.fn(), performContinuously: jest.fn() },
		emojiPicker: { open: jest.fn(), close: jest.fn() },
		flows: {},
	};

	return chat as unknown as ChatAPI & { composer?: ReturnType<typeof createComposerAPI> };
};

const renderMessageBox = (onSend: jest.Mock, endpointHandler: jest.Mock) => {
	const chat = createChatStub();

	(useChat as jest.Mock).mockReturnValue(chat);

	const view = render(<MessageBox showFormattingTips={false} onSend={onSend} />, {
		wrapper: mockAppRoot().withUserPreference('sendOnEnter', 'normal').withEndpoint('POST', '/v1/rooms.saveDraft', endpointHandler).build(),
	});

	return { chat, ...view };
};

beforeEach(() => {
	(useRoom as jest.Mock).mockReturnValue({ _id: 'rid', t: 'c', name: 'general' });
	(useRoomSubscription as jest.Mock).mockReturnValue({ rid: 'rid' });
	(useComposerPopupOptions as jest.Mock).mockReturnValue([]);
	(useFileUpload as jest.Mock).mockReturnValue({
		hasUploads: false,
		handleUploadFiles: jest.fn(),
		isUploading: false,
		isProcessingUploads: false,
	});
});

afterEach(() => {
	localStorage.clear();
	jest.clearAllMocks();
});

describe('MessageBox drafts', () => {
	it('should not discard a newer draft when a pending send resolves after the room changed', async () => {
		const user = userEvent.setup();
		const endpointHandler = jest.fn(() => null);

		let resolveSend: (() => void) | undefined;
		// Mirrors the real send flow: it clears the composer, then awaits the server response.
		const onSend = jest.fn(() => {
			chat.composer?.clear();

			return new Promise<void>((resolve) => {
				resolveSend = () => resolve();
			});
		});

		const { chat, unmount } = renderMessageBox(onSend, endpointHandler);

		const composer = screen.getByRole('textbox', { name: 'Message #general' });

		// Send a message and keep its response pending.
		await user.type(composer, 'message A');
		// The composer listens for `which`, which userEvent does not set.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.keyDown(composer, { key: 'Enter', which: 13, keyCode: 13 });
		await waitFor(() => expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ value: 'message A' })));

		// Type a new draft while the send is still in flight.
		await user.type(composer, 'draft B');
		await waitFor(() => expect(localStorage.getItem('messagebox_rid')).toBe('draft B'));

		// Leave the room: the draft is flushed to the server on unmount.
		unmount();
		await waitFor(() => expect(endpointHandler).toHaveBeenCalledWith({ rid: 'rid', draft: 'draft B' }));

		// The delayed send finally resolves.
		await act(async () => {
			resolveSend?.();
		});

		expect(endpointHandler).toHaveBeenCalledTimes(1);
		expect(endpointHandler).not.toHaveBeenCalledWith(expect.objectContaining({ draft: '' }));
	});
});
