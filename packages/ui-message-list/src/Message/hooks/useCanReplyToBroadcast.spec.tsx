import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useCanReplyToBroadcast } from './useCanReplyToBroadcast';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';
import type { MessageRelatedDataContextValue } from '../contexts/MessageRelatedDataContext';

const message = createFakeMessage<IMessage>({ u: { _id: 'author', username: 'author' } });
const subscription = { _id: 'subscription', rid: 'room', t: 'c', broadcast: true } as ISubscription;

const render = (useConversation: unknown, display = {}) =>
	renderHook(() => useCanReplyToBroadcast(message), {
		wrapper: mockMessageProviders({
			root: mockAppRoot().withJohnDoe(),
			display,
			relatedData: { useConversation: useConversation as MessageRelatedDataContextValue['useConversation'] },
		}).wrapper,
	});

it('reads only whether the conversation is a broadcast, through the select option of the related data (message-variants R49)', () => {
	const useConversation = jest.fn<
		ReturnType<MessageRelatedDataContextValue['useConversation']>,
		Parameters<MessageRelatedDataContextValue['useConversation']>
	>((_message, { select }) => ({ data: select?.({ room: undefined, subscription }) as never, isLoading: false, isError: false }));

	const { result } = render(useConversation);

	expect(result.current).toBe(true);
	expect(useConversation).toHaveBeenCalledWith(message, { enabled: true, select: expect.any(Function) });
});

it('asks nothing of a place where messages cannot be acted on (message-variants R49)', () => {
	const useConversation = jest.fn(() => ({ data: undefined, isLoading: false, isError: false }));

	const { result } = render(useConversation, { allowsInteraction: false });

	expect(result.current).toBe(false);
	expect(useConversation).toHaveBeenCalledWith(message, { enabled: false, select: expect.any(Function) });
});
