import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MessageToolbarHolder from './MessageToolbarHolder';
import type { MessageConversation, MessageRelatedDataContextValue } from './contexts/MessageRelatedDataContext';
import { mockMessageProviders } from '../../tests/utils/mockMessageProviders';

let mockOnScreen = true;

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	useIsVisible: () => [jest.fn(), mockOnScreen],
}));

const room = { _id: 'room', t: 'c' } as IRoom;
const subscription = { _id: 'subscription', rid: room._id, t: 'c' } as ISubscription;
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
	const edit = {
		id: 'edit',
		icon: 'edit' as const,
		label: 'Edit' as never,
		order: 0,
		group: 'menu' as const,
		type: 'management' as const,
		action: jest.fn(),
	};
	const { wrapper } = mockMessageProviders({
		root: mockAppRoot().withTranslations('en', 'core', { Message_actions: 'Message actions', More: 'More', Edit: 'Edit' }),
		display: { allowsInteraction },
		relatedData: { useConversation: useConversation as unknown as MessageRelatedDataContextValue['useConversation'] },
		toolbar: { useMenuActions: () => [edit] },
	});

	const view = render(<MessageToolbarHolder message={message} context='pinned' />, { wrapper });

	return { ...view, useConversation, element: <MessageToolbarHolder message={message} context='pinned' /> };
};

describe('MessageToolbarHolder', () => {
	beforeEach(() => {
		mockOnScreen = true;
	});

	it('renders nothing where messages do not allow interaction (R1)', () => {
		const { container, useConversation } = renderHolder({ allowsInteraction: false });

		expect(container).toBeEmptyDOMElement();
		expect(useConversation).toHaveBeenCalledWith(message, { enabled: false });
	});

	it('renders the toolbar once the room is known and waits for it (R2)', async () => {
		const { useConversation, unmount } = renderHolder();

		expect(await screen.findByRole('toolbar', { name: 'Message actions' })).toBeInTheDocument();
		expect(useConversation).toHaveBeenCalledWith(message, { enabled: true });
		unmount();

		renderHolder({ conversation: { room: undefined, subscription: undefined } });

		await act(() => import('./toolbar/MessageToolbar'));

		expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
	});

	it('renders no toolbar while the message is off screen (R2)', () => {
		mockOnScreen = false;

		renderHolder();

		expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
	});

	it('keeps the toolbar while a popup is open and lets go when it closes (R3)', async () => {
		const { rerender, element, container } = renderHolder();
		// The wrapper has no role: its class is how Fuselage shows the toolbar.
		// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const wrapper = () => container.querySelector('.rcx-message-toolbar__wrapper');

		await userEvent.click(await screen.findByRole('button', { name: 'More' }));
		mockOnScreen = false;
		rerender(element);

		expect(screen.getByRole('toolbar', { name: 'Message actions', hidden: true })).toBeInTheDocument();
		expect(wrapper()).toHaveClass('rcx-message-toolbar__wrapper--visible');

		await userEvent.keyboard('{Escape}');
		rerender(element);

		expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
		expect(wrapper()).not.toHaveClass('rcx-message-toolbar__wrapper--visible');
	});
});
