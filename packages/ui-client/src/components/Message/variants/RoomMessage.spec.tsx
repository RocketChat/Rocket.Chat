import type { IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RoomMessage from './RoomMessage';
import * as stories from './RoomMessage.stories';
import { mockMessageProviders } from '../../../../tests/utils/mockMessageProviders';
import { createMessageSelectionStore } from '../contexts/MessageSelectionContext';

const message: IMessage = createFakeMessage({
	_id: 'messageId',
	msg: 'message body',
	u: { _id: 'userId', name: 'userName', username: 'userName' },
});

const props = { message, sequential: false, all: false, mention: false, unread: false, ignoredUser: false };

const Throwing = () => {
	throw new Error('cannot render');
};

it('should show a message with its author and body', () => {
	render(<RoomMessage {...props} />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.getByRole('figure')).toBeInTheDocument();
	expect(screen.getByText('message body')).toBeInTheDocument();
	expect(screen.getByRole('listitem')).toHaveAttribute('aria-labelledby', 'messageId-displayName messageId-time messageId-content');
});

it('should hide the avatar when avatars are off', () => {
	render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ display: { showAvatars: false } }).wrapper });

	expect(screen.queryByRole('figure')).not.toBeInTheDocument();
});

it('should hide the content of an ignored author until revealed', async () => {
	render(<RoomMessage {...props} ignoredUser />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.queryByText('message body')).not.toBeInTheDocument();
	await userEvent.click(screen.getByRole('button', { name: 'Message_Ignored' }));
	expect(screen.getByText('message body')).toBeInTheDocument();
});

it('should hide the content of an ignored message', () => {
	render(<RoomMessage {...props} message={{ ...message, ignored: true }} />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.queryByText('message body')).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Message_Ignored' })).toBeInTheDocument();
});

it('should show the read receipt only when read receipts are on', () => {
	const { unmount } = render(<RoomMessage {...props} />, {
		wrapper: mockMessageProviders({ display: { readReceipts: { enabled: true, storeUsers: false } } }).wrapper,
	});
	expect(screen.getByRole('status', { name: 'Message_viewed' })).toBeInTheDocument();
	expect(screen.getByRole('listitem')).toHaveAttribute('aria-labelledby', expect.stringContaining('messageId-read-status'));
	unmount();

	render(<RoomMessage {...props} />, { wrapper: mockMessageProviders().wrapper });
	expect(screen.queryByRole('status', { name: 'Message_viewed' })).not.toBeInTheDocument();
});

it('should mark a pending message as busy', () => {
	render(<RoomMessage {...props} message={{ ...message, temp: true }} />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.getByRole('listitem')).toHaveAttribute('aria-busy', 'true');
	expect(screen.getByRole('listitem')).toHaveClass('rcx-message--pending');
});

it('should draw the message being edited with the editing look', () => {
	render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ editingMessageId: 'messageId' }).wrapper });

	expect(screen.getByRole('listitem')).toHaveClass('rcx-message--editing');
});

it('should show a placeholder for an encrypted message not decrypted yet', () => {
	render(<RoomMessage {...props} message={{ ...message, t: 'e2e', e2e: 'pending' } as IMessage} />, {
		wrapper: mockMessageProviders().wrapper,
	});

	expect(screen.getByText('E2E_message_encrypted_placeholder')).toBeInTheDocument();
	expect(screen.queryByText('message body')).not.toBeInTheDocument();
});

it('should expose the thread markers of the row', () => {
	render(<RoomMessage {...props} unread />, { wrapper: mockMessageProviders().wrapper });

	expect(screen.getByRole('listitem')).toHaveAttribute('data-unread', 'true');
});

it('should show a placeholder instead of failing when the content cannot be rendered', () => {
	jest.spyOn(console, 'error').mockImplementation(() => undefined);

	render(<RoomMessage {...props} sequential />, { wrapper: mockMessageProviders({ renderers: { Markup: Throwing } }).wrapper });

	expect(screen.getByRole('listitem', { name: 'Message_could_not_be_displayed' })).toBeInTheDocument();
});

describe('selection mode', () => {
	it('should toggle the selection by clicking the row', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		const checkbox = screen.getByRole('checkbox', { name: 'Select_message_from_user_with_preview' });
		expect(checkbox).not.toBeChecked();

		await userEvent.click(screen.getByRole('listitem'));
		expect(selection.isSelected('messageId')).toBe(true);
		expect(checkbox).toBeChecked();
	});

	it('should toggle the selection with Space and Enter', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		act(() => screen.getByRole('listitem').focus());
		await userEvent.keyboard(' ');
		expect(selection.isSelected('messageId')).toBe(true);
		await userEvent.keyboard('{Enter}');
		expect(selection.isSelected('messageId')).toBe(false);
	});

	it('should keep the selection of each provider apart', () => {
		const roomSelection = createMessageSelectionStore({ isSelecting: true });
		const threadSelection = createMessageSelectionStore();
		roomSelection.toggle('messageId');

		expect(threadSelection.isSelected('messageId')).toBe(false);
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations', async (_storyName, Story) => {
		const { container } = render(<Story />);

		expect(await axe(container)).toHaveNoViolations();
	});
});
