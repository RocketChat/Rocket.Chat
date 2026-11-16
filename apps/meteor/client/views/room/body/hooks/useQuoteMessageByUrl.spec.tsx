import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useQuoteMessageByUrl } from './useQuoteMessageByUrl';
import { createFakeMessage } from '../../../../../tests/mocks/data';
import type { ChatAPI, ComposerAPI } from '../../../../lib/chats/ChatAPI';
import { ChatContext } from '../../contexts/ChatContext';

const quoted = createFakeMessage({ _id: 'quoted', rid: 'room-id' });

// A chat whose composer registers only when the test says, so the test controls when it appears
const createChat = () => {
	const listeners = new Set<() => void>();
	const chat = {
		composer: undefined as ComposerAPI | undefined,
		data: { getMessageByID: async (mid: IMessage['_id']) => (mid === quoted._id ? quoted : undefined) },
		subscribeToComposer: (onChange: () => void) => {
			listeners.add(onChange);
			return () => listeners.delete(onChange);
		},
		setComposerAPI: (composer?: ComposerAPI) => {
			chat.composer = composer;
			listeners.forEach((onChange) => onChange());
		},
	};
	return chat;
};

const createComposer = () => ({ quoteMessage: jest.fn() }) as unknown as ComposerAPI & { quoteMessage: jest.Mock };

const renderQuote = (chat: ReturnType<typeof createChat>, search: Record<string, string>) =>
	renderHook(() => useQuoteMessageByUrl(), {
		wrapper: mockAppRoot()
			.withRouter({ getSearchParameters: () => search })
			.wrap((children: ReactNode) => <ChatContext.Provider value={chat as unknown as ChatAPI}>{children}</ChatContext.Provider>)
			.build(),
	});

it('quotes the message of the link in the composer that is there', async () => {
	const chat = createChat();
	const composer = createComposer();
	chat.setComposerAPI(composer);

	renderQuote(chat, { reply: quoted._id });

	await waitFor(() => expect(composer.quoteMessage).toHaveBeenCalledWith(quoted));
});

it('quotes the message of the link once the composer of a room that was not open yet registers', async () => {
	const chat = createChat();
	renderQuote(chat, { reply: quoted._id });
	await act(async () => undefined);

	const composer = createComposer();
	act(() => chat.setComposerAPI(composer));

	await waitFor(() => expect(composer.quoteMessage).toHaveBeenCalledWith(quoted));
});

it('quotes nothing without a link to a message', async () => {
	const chat = createChat();
	renderQuote(chat, {});

	const composer = createComposer();
	act(() => chat.setComposerAPI(composer));
	await act(async () => undefined);

	expect(composer.quoteMessage).not.toHaveBeenCalled();
});
