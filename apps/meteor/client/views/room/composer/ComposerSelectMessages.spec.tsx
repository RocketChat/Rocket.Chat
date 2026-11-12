import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ComposerSelectMessages from './ComposerSelectMessages';
import { Messages } from '../../../stores';
import { SelectedMessagesProvider, selectedMessageStore } from '../providers/SelectedMessagesProvider';

jest.mock('../modals/ForwardMessageModal', () => ({
	__esModule: true,
	default: ({ messages }: { messages: any[] }) => <div data-testid='forward-modal'>Forward message ({messages.length})</div>,
}));

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Cancel: 'Cancel',
		Clear_selection: 'Clear selection',
		Forward: 'Forward',
		__count__messages_selected: '{{count}} messages selected',
		Select__count__messages: 'Select {{count}} messages',
	})
	.build();

describe('ComposerSelectMessages', () => {
	beforeEach(() => {
		selectedMessageStore.reset();
	});

	it('should render selection count and action buttons', () => {
		const onClickSelectAll = jest.fn();

		render(
			<SelectedMessagesProvider>
				<ComposerSelectMessages onClickSelectAll={onClickSelectAll} />
			</SelectedMessagesProvider>,
			{ wrapper: appRoot },
		);

		expect(screen.getByText('0 messages selected')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Clear selection' })).toBeDisabled();
		expect(screen.getByRole('button', { name: 'Forward' })).toBeDisabled();
	});

	it('should enable Forward and Clear buttons when messages are selected', () => {
		selectedMessageStore.toggle('msg-1');
		selectedMessageStore.toggle('msg-2');

		render(
			<SelectedMessagesProvider>
				<ComposerSelectMessages onClickSelectAll={jest.fn()} />
			</SelectedMessagesProvider>,
			{ wrapper: appRoot },
		);

		expect(screen.getByText('2 messages selected')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Clear selection' })).not.toBeDisabled();
		expect(screen.getByRole('button', { name: 'Forward' })).not.toBeDisabled();
	});

	it('should reset selection when Cancel is clicked', async () => {
		selectedMessageStore.setIsSelecting(true);
		selectedMessageStore.toggle('msg-1');

		render(
			<SelectedMessagesProvider>
				<ComposerSelectMessages onClickSelectAll={jest.fn()} />
			</SelectedMessagesProvider>,
			{ wrapper: appRoot },
		);

		const cancelButton = screen.getByRole('button', { name: 'Cancel' });
		await userEvent.click(cancelButton);

		expect(selectedMessageStore.getIsSelecting()).toBe(false);
		expect(selectedMessageStore.count()).toBe(0);
	});

	it('should clear selection when Clear selection is clicked', async () => {
		selectedMessageStore.toggle('msg-1');

		render(
			<SelectedMessagesProvider>
				<ComposerSelectMessages onClickSelectAll={jest.fn()} />
			</SelectedMessagesProvider>,
			{ wrapper: appRoot },
		);

		const clearButton = screen.getByRole('button', { name: 'Clear selection' });
		await userEvent.click(clearButton);

		expect(selectedMessageStore.count()).toBe(0);
	});

	it('should resolve messages from store and open ForwardMessageModal when Forward is clicked', async () => {
		const mockMessage = {
			_id: 'msg-1',
			rid: 'room-1',
			msg: 'Hello world',
			ts: new Date(),
			u: { _id: 'u1', username: 'alice' },
		} as any;

		Messages.state.store(mockMessage);
		selectedMessageStore.toggle('msg-1');

		render(
			<SelectedMessagesProvider>
				<ComposerSelectMessages onClickSelectAll={jest.fn()} />
			</SelectedMessagesProvider>,
			{ wrapper: appRoot },
		);

		const forwardButton = screen.getByRole('button', { name: 'Forward' });
		await userEvent.click(forwardButton);

		await waitFor(() => {
			expect(screen.getByTestId('forward-modal')).toHaveTextContent('Forward message (1)');
		});
	});
});
