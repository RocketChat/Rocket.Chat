import { after, afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, Mock } from 'jest-mock';

import type { createComposerAPI } from './createComposerAPI';
import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';
import type { ChatAPI } from '../../../../lib/chats/ChatAPI';

let MessageBox: (typeof import('./MessageBox'))['default'];
let useFileUpload: (typeof import('../../body/hooks/useFileUpload'))['useFileUpload'];
let useChat: (typeof import('../../contexts/ChatContext'))['useChat'];
let useComposerPopupOptions: (typeof import('../../contexts/ComposerPopupContext'))['useComposerPopupOptions'];
let useRoom: (typeof import('../../contexts/RoomContext'))['useRoom'];
let useRoomSubscription: (typeof import('../../contexts/RoomContext'))['useRoomSubscription'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const createChatStub = () => {
	const chat = {
		composer: undefined as ReturnType<typeof createComposerAPI> | undefined,
		setComposerAPI: (composer?: ReturnType<typeof createComposerAPI>) => {
			chat.composer?.release();
			chat.composer = composer;
		},
		currentEditingMessage: { getMID: () => undefined },
		action: { start: fn<FunctionLike>(), stop: fn<FunctionLike>(), performContinuously: fn<FunctionLike>() },
		emojiPicker: { open: fn<FunctionLike>(), close: fn<FunctionLike>() },
		flows: {},
	};

	return chat as unknown as ChatAPI & { composer?: ReturnType<typeof createComposerAPI> };
};

const renderMessageBox = (onSend: Mock<FunctionLike>, endpointHandler: Mock<FunctionLike>) => {
	const chat = createChatStub();

	(useChat as Mock<FunctionLike>).mockReturnValue(chat);

	const view = render(<MessageBox showFormattingTips={false} onSend={onSend} />, {
		wrapper: mockAppRoot().withUserPreference('sendOnEnter', 'normal').withEndpoint('POST', '/v1/rooms.saveDraft', endpointHandler).build(),
	});

	return { chat, ...view };
};

describe('MessageBox drafts', () => {
	before(() => {
		enterModuleScope();
		mock.module('../../../../lib/rooms/roomCoordinator', {
			exports: {
				roomCoordinator: { getRoomDirectives: () => ({ canSendMessage: () => true }) },
			},
		});
		mock.module('../../../../lib/getURL', {
			exports: {
				getURL: (url: string) => url,
			},
		});
		mock.module('../../hooks/useE2EERoomState', {
			exports: {
				useE2EERoomState: fn<FunctionLike>(),
			},
		});
		mock.module('../../contexts/ChatContext', {
			exports: {
				useChat: fn<FunctionLike>(),
			},
		});
		mock.module('../../contexts/RoomContext', {
			exports: {
				useRoom: fn<FunctionLike>(),
				useRoomSubscription: fn<FunctionLike>(),
			},
		});
		mock.module('../../contexts/ComposerPopupContext', {
			exports: {
				useComposerPopupOptions: fn<FunctionLike>(),
			},
		});
		mock.module('../../body/hooks/useFileUpload', {
			exports: {
				useFileUpload: fn<FunctionLike>(),
			},
		});
		({ default: MessageBox } = require('./MessageBox'));
		({ useFileUpload } = require('../../body/hooks/useFileUpload'));
		({ useChat } = require('../../contexts/ChatContext'));
		({ useComposerPopupOptions } = require('../../contexts/ComposerPopupContext'));
		({ useRoom, useRoomSubscription } = require('../../contexts/RoomContext'));
	});

	after(leaveModuleScope);

	beforeEach(() => {
		(useRoom as Mock<FunctionLike>).mockReturnValue({ _id: 'rid', t: 'c', name: 'general' });
		(useRoomSubscription as Mock<FunctionLike>).mockReturnValue({ rid: 'rid' });
		(useComposerPopupOptions as Mock<FunctionLike>).mockReturnValue([]);
		(useFileUpload as Mock<FunctionLike>).mockReturnValue({
			hasUploads: false,
			handleUploadFiles: fn<FunctionLike>(),
			isUploading: false,
			isProcessingUploads: false,
		});
	});

	afterEach(() => {
		localStorage.clear();
		mocker.clearAllMocks();
	});
	it('should not discard a newer draft when a pending send resolves after the room changed', async () => {
		const user = userEvent.setup();
		const endpointHandler = fn<FunctionLike>(() => null);

		let resolveSend: (() => void) | undefined;
		// Mirrors the real send flow: it clears the composer, then awaits the server response.
		const onSend = fn<FunctionLike>(() => {
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

	it('should not persist what is typed while a send is still in flight', async () => {
		const user = userEvent.setup();
		const endpointHandler = fn<FunctionLike>(() => null);

		(useRoomSubscription as Mock<FunctionLike>).mockReturnValue({ rid: 'rid', draft: 'message A' });

		let resolveSend: (() => void) | undefined;
		const onSend = fn<FunctionLike>(() => {
			chat.composer?.clear();

			return new Promise<void>((resolve) => {
				resolveSend = () => resolve();
			});
		});

		const { chat } = renderMessageBox(onSend, endpointHandler);

		const composer = screen.getByRole('textbox', { name: 'Message #general' });

		// Send the stored draft and keep its response pending.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.keyDown(composer, { key: 'Enter', which: 13, keyCode: 13 });
		await waitFor(() => expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ value: 'message A' })));

		// The sent draft is discarded right away, without waiting for the response.
		await waitFor(() => expect(endpointHandler).toHaveBeenCalledWith({ rid: 'rid', draft: '' }));

		// Type again, still in the same room, while the send is in flight.
		await user.type(composer, 'draft B');
		await waitFor(() => expect(localStorage.getItem('messagebox_rid')).toBe('draft B'));

		await act(async () => {
			resolveSend?.();
		});

		// Staying in the room keeps the new text local only.
		expect(endpointHandler).toHaveBeenCalledTimes(1);
		expect(endpointHandler).not.toHaveBeenCalledWith(expect.objectContaining({ draft: 'draft B' }));
	});

	it('should keep the draft when the send flow leaves the text in the composer', async () => {
		const user = userEvent.setup();
		const endpointHandler = fn<FunctionLike>(() => null);

		const onSend = fn<FunctionLike>(() => Promise.resolve());

		const { unmount } = renderMessageBox(onSend, endpointHandler);

		const composer = screen.getByRole('textbox', { name: 'Message #general' });

		await user.type(composer, 'a message over the limit');
		await waitFor(() => expect(localStorage.getItem('messagebox_rid')).toBe('a message over the limit'));

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.keyDown(composer, { key: 'Enter', which: 13, keyCode: 13 });
		await waitFor(() => expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ value: 'a message over the limit' })));

		// The unsent text survives a reload…
		await waitFor(() => expect(localStorage.getItem('messagebox_rid')).toBe('a message over the limit'));

		// …and leaving the room.
		unmount();
		await waitFor(() => expect(endpointHandler).toHaveBeenCalledWith({ rid: 'rid', draft: 'a message over the limit' }));
	});
});
