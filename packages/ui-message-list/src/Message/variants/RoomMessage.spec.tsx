import type { IMessage } from '@rocket.chat/core-typings';
import { createFakeMessage, mockAppRoot } from '@rocket.chat/mock-providers';
import { UserCardContext } from '@rocket.chat/ui-contexts';
import { composeStories } from '@storybook/react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RoomMessage from './RoomMessage';
import * as stories from './RoomMessage.stories';
import { mockMessageProviders } from '../../../tests/utils/mockMessageProviders';
import { createMessageSelectionStore } from '../contexts/MessageSelectionContext';

jest.mock('../MessageToolbarHolder', () => ({
	__esModule: true,
	default: ({ context }: { context?: string }) => <div data-testid='toolbar' data-context={context} />,
}));

const message: IMessage = createFakeMessage({
	_id: 'messageId',
	msg: 'message body',
	u: { _id: 'userId', name: 'userName', username: 'userName' },
});

const props = { message, sequential: false, all: false, mention: false, unread: false, ignoredUser: false };

const Throwing = () => {
	throw new Error('cannot render');
};

describe('the row', () => {
	it('renders a focusable list item with its role description and data attributes (R1)', () => {
		render(<RoomMessage {...props} unread />, {
			wrapper: mockMessageProviders({ root: mockAppRoot().withUser({ _id: 'userId', username: 'userName' } as never) }).wrapper,
		});

		const item = screen.getByRole('listitem');
		expect(item).toHaveAttribute('tabindex', '0');
		expect(item).toHaveAttribute('aria-roledescription', 'message');
		expect(item).toHaveAttribute('id', 'messageId');
		expect(item).toHaveAttribute('data-id', 'messageId');
		expect(item).toHaveAttribute('data-mid', 'messageId');
		expect(item).toHaveAttribute('data-unread', 'true');
		expect(item).toHaveAttribute('data-sequential', 'false');
		expect(item).toHaveAttribute('data-own', 'true');
	});

	it('marks a row of another author as not its own (R1)', () => {
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders().wrapper });

		expect(screen.getByRole('listitem')).toHaveAttribute('data-own', 'false');
	});

	it('names the row by the name, the time and the content, and by the content alone when sequential (R2)', () => {
		const { unmount } = render(<RoomMessage {...props} />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.getByRole('listitem')).toHaveAttribute('aria-labelledby', 'messageId-displayName messageId-time messageId-content');
		unmount();

		render(<RoomMessage {...props} sequential />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.getByRole('listitem')).toHaveAttribute('aria-labelledby', 'messageId-content');
	});

	it('names the row by the read status after the content when read receipts are on (R16)', () => {
		render(<RoomMessage {...props} />, {
			wrapper: mockMessageProviders({ display: { readReceipts: { enabled: true, storeUsers: false } } }).wrapper,
		});

		expect(screen.getByRole('listitem')).toHaveAttribute(
			'aria-labelledby',
			'messageId-displayName messageId-time messageId-content messageId-read-status',
		);
		expect(screen.getByRole('status', { name: 'Message_viewed' })).toBeInTheDocument();
	});

	it('passes the other props to its root (R6)', () => {
		render(<RoomMessage {...props} data-tmid='thread' />, { wrapper: mockMessageProviders().wrapper });

		expect(screen.getByRole('listitem')).toHaveAttribute('data-tmid', 'thread');
	});

	it('leaves out the avatar and the header of a sequential message and moves the indicators (R9)', () => {
		const pinned = { ...message, pinned: true } as IMessage;
		const { unmount } = render(<RoomMessage {...props} message={pinned} sequential />, { wrapper: mockMessageProviders().wrapper });

		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
		expect(screen.queryByText('userName')).not.toBeInTheDocument();
		expect(screen.getByTitle('Message_has_been_pinned')).toBeInTheDocument();
		unmount();

		render(<RoomMessage {...props} message={pinned} />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.getByRole('figure')).toBeInTheDocument();
		expect(screen.getByText('userName')).toBeInTheDocument();
		expect(screen.getByTitle('Message_has_been_pinned')).toBeInTheDocument();
	});
});

describe('the avatar', () => {
	it('shows only under its conditions (R14)', () => {
		const { unmount } = render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ display: { showAvatars: false } }).wrapper });
		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
		unmount();

		const selecting = render(<RoomMessage {...props} />, {
			wrapper: mockMessageProviders({ selection: createMessageSelectionStore({ isSelecting: true }) }).wrapper,
		});
		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
		selecting.unmount();

		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.getByRole('figure')).toBeInTheDocument();
	});

	it('opens the user info on click without the click reaching what is around the row (R14)', async () => {
		const openUserInfo = jest.fn();
		const around = jest.fn();
		document.addEventListener('click', around);
		const root = mockAppRoot().wrap((children) => (
			<UserCardContext.Provider value={{ openUserCard: jest.fn(), openUserInfo, closeUserCard: jest.fn(), triggerProps: {} }}>
				{children}
			</UserCardContext.Provider>
		));

		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ root }).wrapper });
		await userEvent.click(screen.getByRole('img', { hidden: true }));
		document.removeEventListener('click', around);

		expect(openUserInfo).toHaveBeenCalledWith('userName');
		expect(around).not.toHaveBeenCalled();
	});
});

describe('states', () => {
	it('draws a pending message with the pending look and marks it busy (R17)', () => {
		render(<RoomMessage {...props} message={{ ...message, temp: true }} />, { wrapper: mockMessageProviders().wrapper });

		expect(screen.getByRole('listitem')).toHaveAttribute('aria-busy', 'true');
		expect(screen.getByRole('listitem')).toHaveClass('rcx-message--pending');
	});

	it('draws the message being edited with the editing look, and no other (R18)', () => {
		const { unmount } = render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ editingMessageId: 'messageId' }).wrapper });
		expect(screen.getByRole('listitem')).toHaveClass('rcx-message--editing');
		unmount();

		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ editingMessageId: 'another' }).wrapper });
		expect(screen.getByRole('listitem')).not.toHaveClass('rcx-message--editing');
	});

	it('shows a placeholder for an encrypted message until it is decrypted (R30)', () => {
		const encrypted = { ...message, t: 'e2e', e2e: 'pending' } as IMessage;
		const { unmount } = render(<RoomMessage {...props} message={encrypted} />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.getByText('E2E_message_encrypted_placeholder')).toBeInTheDocument();
		expect(screen.queryByText('message body')).not.toBeInTheDocument();
		unmount();

		render(<RoomMessage {...props} message={{ ...encrypted, e2e: 'done' } as IMessage} />, { wrapper: mockMessageProviders().wrapper });
		expect(screen.queryByText('E2E_message_encrypted_placeholder')).not.toBeInTheDocument();
		expect(screen.getByText('message body')).toBeInTheDocument();
	});

	it('shows a placeholder instead of failing when the content cannot be rendered (R37)', () => {
		jest.spyOn(console, 'error').mockImplementation(() => undefined);

		render(<RoomMessage {...props} sequential />, { wrapper: mockMessageProviders({ renderers: { Markup: Throwing } }).wrapper });

		expect(screen.getByRole('listitem', { name: 'Message_could_not_be_displayed' })).toBeInTheDocument();
	});

	it('draws the content again once the message changes (R37)', () => {
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const { wrapper } = mockMessageProviders({ renderers: { Markup: Throwing } });
		const { rerender } = render(<RoomMessage {...props} />, { wrapper });
		expect(screen.getByText('Message_could_not_be_displayed')).toBeInTheDocument();

		rerender(<RoomMessage {...props} message={{ ...message, msg: '', md: [] }} />);

		expect(screen.queryByText('Message_could_not_be_displayed')).not.toBeInTheDocument();
	});
});

describe('ignored messages', () => {
	it('hides the content of an ignored user or message until revealed, and again when the user is ignored (R27)', async () => {
		const { wrapper } = mockMessageProviders();
		const { unmount } = render(<RoomMessage {...props} ignoredUser />, { wrapper });
		expect(screen.queryByText('message body')).not.toBeInTheDocument();
		expect(screen.getByText('userName')).toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: 'Message_Ignored' }));
		expect(screen.getByText('message body')).toBeInTheDocument();
		unmount();

		const flagged = render(<RoomMessage {...props} message={{ ...message, ignored: true } as IMessage} />, { wrapper });
		expect(screen.queryByText('message body')).not.toBeInTheDocument();
		flagged.unmount();

		const { rerender } = render(<RoomMessage {...props} />, { wrapper });
		expect(screen.getByText('message body')).toBeInTheDocument();
		rerender(<RoomMessage {...props} ignoredUser />);
		expect(screen.queryByText('message body')).not.toBeInTheDocument();
	});

	it('reveals an ignored message on demand (R27)', async () => {
		render(<RoomMessage {...props} message={{ ...message, ignored: true } as IMessage} />, { wrapper: mockMessageProviders().wrapper });

		expect(screen.getByRole('figure')).toBeInTheDocument();
		expect(screen.queryByText('message body')).not.toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: 'Message_Ignored' }));

		expect(screen.getByText('message body')).toBeInTheDocument();
	});

	it('reveals one message only, with Enter (R27)', async () => {
		render(
			<>
				<RoomMessage {...props} ignoredUser />
				<RoomMessage {...props} message={{ ...message, _id: 'other', msg: 'other body' }} ignoredUser />
			</>,
			{ wrapper: mockMessageProviders().wrapper },
		);

		screen.getAllByRole('button', { name: 'Message_Ignored' })[0].focus();
		await userEvent.keyboard('{Enter}');

		expect(screen.getByText('message body')).toBeInTheDocument();
		expect(screen.queryByText('other body')).not.toBeInTheDocument();
	});

	// Known defect: ../../../docs/specs/message-variants.md#d2-the-reveal-of-an-ignored-message-ends-when-its-row-unmounts
	it.skip('keeps the content of a revealed message revealed when the row mounts again', async () => {
		const { wrapper } = mockMessageProviders();
		const { unmount } = render(<RoomMessage {...props} ignoredUser />, { wrapper });
		await userEvent.click(screen.getByRole('button', { name: 'Message_Ignored' }));
		unmount();

		render(<RoomMessage {...props} ignoredUser />, { wrapper });

		expect(screen.getByText('message body')).toBeInTheDocument();
	});
});

describe('selection mode', () => {
	it('shows a checkbox named by the author and the text, in place of the avatar, and draws a selected row selected (R19)', () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		selection.toggle('messageId');
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		expect(screen.getByRole('checkbox', { name: 'Select_message_from_user_with_preview' })).toBeChecked();
		expect(screen.queryByRole('figure')).not.toBeInTheDocument();
	});

	it('names the checkbox by the author alone for a message without text (R19)', () => {
		render(<RoomMessage {...props} message={{ ...message, msg: '' }} />, {
			wrapper: mockMessageProviders({ selection: createMessageSelectionStore({ isSelecting: true }) }).wrapper,
		});

		expect(screen.getByRole('checkbox', { name: 'Select_message_from_user' })).not.toBeChecked();
	});

	it('toggles the selection by clicking the row, without the click reaching what is around it (R20)', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		const around = jest.fn();
		document.addEventListener('click', around);
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		await userEvent.click(screen.getByRole('listitem'));
		document.removeEventListener('click', around);

		expect(selection.isSelected('messageId')).toBe(true);
		expect(around).not.toHaveBeenCalled();
	});

	it('toggles the selection with Space and Enter (R21)', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		act(() => screen.getByRole('listitem').focus());
		await userEvent.keyboard(' ');
		expect(selection.isSelected('messageId')).toBe(true);
		await userEvent.keyboard('{Enter}');
		expect(selection.isSelected('messageId')).toBe(false);
	});

	it('toggles once by a click on the visible box of the checkbox (R23)', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		await userEvent.click(screen.getByRole('checkbox').nextElementSibling as HTMLElement);

		expect(selection.isSelected('messageId')).toBe(true);
	});

	// Known defect: ../../../docs/specs/message-variants.md#d3-activating-the-checkbox-input-toggles-the-message-twice
	it.skip('toggles once when the checkbox input itself is activated', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		await userEvent.click(screen.getByRole('checkbox'));

		expect(selection.isSelected('messageId')).toBe(true);
	});

	it('does nothing when it is clicked outside selection mode (R20)', async () => {
		const selection = createMessageSelectionStore();
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		await userEvent.click(screen.getByRole('listitem'));

		expect(selection.isSelected('messageId')).toBe(false);
	});

	it.each([
		['Space', ' '],
		['Enter', '{Enter}'],
	])('selects an unselected message with %s (R21)', async (_key, keys) => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		act(() => screen.getByRole('listitem').focus());
		await userEvent.keyboard(keys);

		expect(selection.isSelected('messageId')).toBe(true);
	});

	it('ignores other keys while selecting (R21)', async () => {
		const selection = createMessageSelectionStore({ isSelecting: true });
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		act(() => screen.getByRole('listitem').focus());
		await userEvent.keyboard('a');

		expect(selection.isSelected('messageId')).toBe(false);
	});

	it('neither selects on Enter nor shows a checkbox outside selection mode (R19, R21)', async () => {
		const selection = createMessageSelectionStore();
		render(<RoomMessage {...props} />, { wrapper: mockMessageProviders({ selection }).wrapper });

		act(() => screen.getByRole('listitem').focus());
		await userEvent.keyboard('{Enter}');

		expect(selection.isSelected('messageId')).toBe(false);
		expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
	});
});

describe('the toolbar', () => {
	it('renders the toolbar holder with the place it is given (R39)', () => {
		render(<RoomMessage {...props} context='pinned' />, { wrapper: mockMessageProviders().wrapper });

		expect(screen.getByTestId('toolbar')).toHaveAttribute('data-context', 'pinned');
	});

	it('renders no toolbar for a private message, a pending encrypted one, or while selecting (R39)', () => {
		const views = [
			render(<RoomMessage {...props} message={{ ...message, private: true } as IMessage} />, { wrapper: mockMessageProviders().wrapper }),
			render(<RoomMessage {...props} message={{ ...message, t: 'e2e', e2e: 'pending' } as IMessage} />, {
				wrapper: mockMessageProviders().wrapper,
			}),
			render(<RoomMessage {...props} />, {
				wrapper: mockMessageProviders({ selection: createMessageSelectionStore({ isSelecting: true }) }).wrapper,
			}),
		];

		expect(screen.queryByTestId('toolbar')).not.toBeInTheDocument();
		views.forEach((view) => view.unmount());
	});
});

describe('stories', () => {
	const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

	test.each(testCases)('%s should have no accessibility violations (R8)', async (_storyName, Story) => {
		const { container } = render(<Story />);

		expect(await axe(container)).toHaveNoViolations();
	});
});
