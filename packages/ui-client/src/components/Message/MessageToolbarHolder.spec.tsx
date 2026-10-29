import type { IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, createFakeRoom, createFakeSubscription, mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';

import MessageToolbarHolder from './MessageToolbarHolder';
import type { MessageConversation } from './contexts/MessageRelatedDataContext';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';

jest.mock('./hooks/useIsVisible', () => ({
	useIsVisible: () => [jest.fn(), true],
}));

const room = createFakeRoom({ _id: 'room' });
const subscription = createFakeSubscription({ rid: room._id });
const message = createFakeMessage({ _id: 'message', rid: room._id });

const renderHolder = ({
	allowsInteraction = true,
	conversation = { room, subscription },
}: { allowsInteraction?: boolean; conversation?: MessageConversation } = {}) => {
	const useConversation = jest.fn((_message: IMessage, _options: { enabled: boolean }) => ({
		data: conversation,
		isLoading: false,
		isError: false,
	}));
	const { wrapper } = mockMessageProviders({
		root: mockAppRoot().withTranslations('en', 'core', { Message_actions: 'Message actions' }),
		display: { allowsInteraction },
		relatedData: { useConversation },
	});

	const view = render(<MessageToolbarHolder message={message} context='pinned' />, { wrapper });

	return { ...view, useConversation };
};

describe('MessageToolbarHolder', () => {
	it('should render nothing where messages do not allow interaction', () => {
		const { container, useConversation } = renderHolder({ allowsInteraction: false });

		expect(container).toBeEmptyDOMElement();
		expect(useConversation).toHaveBeenCalledWith(message, { enabled: false });
	});

	it('should render the toolbar once the conversation resolves', async () => {
		const { useConversation } = renderHolder();

		expect(await screen.findByRole('toolbar', { name: 'Message actions' })).toBeInTheDocument();
		expect(useConversation).toHaveBeenCalledWith(message, { enabled: true });
	});

	it('should wait for the room before rendering the toolbar', async () => {
		renderHolder({ conversation: { room: undefined, subscription: undefined } });

		await act(() => import('./toolbar/MessageToolbar'));

		expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
	});
});
