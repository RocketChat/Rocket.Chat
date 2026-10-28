import { FocusScope } from '@react-aria/focus';
import { useToolbar } from '@react-aria/toolbar';
import { Message, MessageSystem } from '@rocket.chat/fuselage';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { useRef } from 'react';

import { useMessageListNavigation } from './useMessageListNavigation';

beforeEach(() => {
	const { matches } = HTMLElement.prototype;
	// JSDOM does not track keyboard focus visibility as a browser does. Treat every focused element
	// as focus-visible here; these tests do not verify the distinction between mouse and keyboard focus.
	jest.spyOn(HTMLElement.prototype, 'matches').mockImplementation(function (this: HTMLElement, selector: string) {
		return matches.call(this, selector === ':focus-visible' ? ':focus' : selector);
	});
});

afterEach(() => {
	jest.restoreAllMocks();
});

// A real react-aria toolbar, whose `onKeyDownCapture` runs at the app root, as the message toolbar's does
const Toolbar = ({ children, 'aria-label': ariaLabel }: { 'children': ReactNode; 'aria-label': string }) => {
	const ref = useRef<HTMLDivElement>(null);
	const { toolbarProps } = useToolbar({ 'aria-label': ariaLabel }, ref);

	return (
		<div {...toolbarProps} ref={ref}>
			{children}
		</div>
	);
};

const Room = () => {
	const { messageListRef } = useMessageListNavigation();

	return (
		<>
			<header className='rcx-room-header'>
				<button>Favorite</button>
			</header>
			<div ref={messageListRef} role='list' aria-label='Messages'>
				<MessageSystem role='listitem' tabIndex={0} aria-label='System message'>
					Channel created
				</MessageSystem>
				{['msg1', 'msg2'].map((message) => (
					<Message key={message} role='listitem' tabIndex={0} aria-label={message}>
						<button aria-label={`Author of ${message}`}>User</button>
						{message}
						<Toolbar aria-label={`Actions for ${message}`}>
							<button aria-label={`React to ${message}`}>Add reaction</button>
							<button aria-label={`Reply to ${message}`}>Reply</button>
						</Toolbar>
					</Message>
				))}
			</div>
			<textarea aria-label='Message composer' />
		</>
	);
};

const renderRoom = () =>
	render(
		<FocusScope>
			<Room />
		</FocusScope>,
	);

it('focuses the latest message when entering the list from the composer', async () => {
	const user = userEvent.setup();
	renderRoom();

	await user.click(screen.getByRole('textbox', { name: 'Message composer' }));
	await user.tab({ shift: true });

	expect(screen.getByRole('listitem', { name: 'msg2' })).toHaveFocus();
});

it('navigates between user and system messages using arrow keys, skipping message controls', async () => {
	const user = userEvent.setup();
	renderRoom();

	await user.tab();
	await user.tab();
	expect(screen.getByRole('listitem', { name: 'msg2' })).toHaveFocus();

	await user.keyboard('{ArrowUp}');
	expect(screen.getByRole('listitem', { name: 'msg1' })).toHaveFocus();

	await user.keyboard('{ArrowUp}');
	expect(screen.getByRole('listitem', { name: 'System message' })).toHaveFocus();

	await user.keyboard('{ArrowDown}');
	expect(screen.getByRole('listitem', { name: 'msg1' })).toHaveFocus();
});

it('moves to the room header with Shift+Tab and restores the last message on re-entry', async () => {
	const user = userEvent.setup();
	renderRoom();

	await user.tab();
	await user.tab();
	await user.keyboard('{ArrowUp}');
	expect(screen.getByRole('listitem', { name: 'msg1' })).toHaveFocus();

	await user.tab({ shift: true });
	expect(screen.getByRole('button', { name: 'Favorite' })).toHaveFocus();

	await user.tab();
	expect(screen.getByRole('listitem', { name: 'msg1' })).toHaveFocus();
});

it('tabs through the focused message only, then moves to the composer instead of the next message', async () => {
	const user = userEvent.setup();
	renderRoom();

	await user.tab();
	await user.tab();
	await user.keyboard('{ArrowUp}');

	await user.tab();
	expect(screen.getByRole('button', { name: 'Author of msg1' })).toHaveFocus();
	await user.tab();
	expect(screen.getByRole('button', { name: 'React to msg1' })).toHaveFocus();

	await user.tab();
	expect(screen.getByRole('textbox', { name: 'Message composer' })).toHaveFocus();
});

it('moves between the toolbar buttons with the arrow keys, and comes back to the one used last', async () => {
	const user = userEvent.setup();
	renderRoom();

	await user.tab();
	await user.tab();
	await user.tab();
	await user.tab();
	expect(screen.getByRole('button', { name: 'React to msg2' })).toHaveFocus();

	await user.keyboard('{ArrowRight}');
	expect(screen.getByRole('button', { name: 'Reply to msg2' })).toHaveFocus();

	await user.tab({ shift: true });
	expect(screen.getByRole('button', { name: 'Author of msg2' })).toHaveFocus();

	await user.tab();
	expect(screen.getByRole('button', { name: 'Reply to msg2' })).toHaveFocus();
});

it('walks back through the message with Shift+Tab, then moves to the room header', async () => {
	const user = userEvent.setup();
	renderRoom();

	await user.tab();
	await user.tab();
	await user.tab();
	await user.tab();
	expect(screen.getByRole('button', { name: 'React to msg2' })).toHaveFocus();

	await user.tab({ shift: true });
	expect(screen.getByRole('button', { name: 'Author of msg2' })).toHaveFocus();
	await user.tab({ shift: true });
	expect(screen.getByRole('listitem', { name: 'msg2' })).toHaveFocus();
	await user.tab({ shift: true });
	expect(screen.getByRole('button', { name: 'Favorite' })).toHaveFocus();
});

it('returns from a message control to its message with Escape', async () => {
	const user = userEvent.setup();
	renderRoom();

	await user.tab();
	await user.tab();
	await user.tab();
	await user.tab();
	expect(screen.getByRole('button', { name: 'React to msg2' })).toHaveFocus();

	await user.keyboard('{Escape}');
	expect(screen.getByRole('listitem', { name: 'msg2' })).toHaveFocus();
});

it('moves from a system message directly to the composer with Tab', async () => {
	const user = userEvent.setup();
	renderRoom();

	await user.tab();
	await user.tab();
	await user.keyboard('{ArrowUp}{ArrowUp}');
	expect(screen.getByRole('listitem', { name: 'System message' })).toHaveFocus();

	await user.tab();
	expect(screen.getByRole('textbox', { name: 'Message composer' })).toHaveFocus();
});
