/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- Match the focusable list items rendered by RoomMessage and SystemMessage. */
import { FocusScope } from '@react-aria/focus';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

const Room = () => {
	const { messageListRef } = useMessageListNavigation();

	return (
		<>
			<header className='rcx-room-header'>
				<button>Favorite</button>
			</header>
			<div ref={messageListRef} role='list' aria-label='Messages'>
				<div role='listitem' tabIndex={0} className='rcx-message-system' aria-label='System message'>
					Channel created
				</div>
				{['msg1', 'msg2'].map((message) => (
					<div key={message} role='listitem' tabIndex={0} aria-label={message}>
						<button aria-label={`Author of ${message}`}>User</button>
						{message}
						<div role='toolbar' aria-label={`Actions for ${message}`}>
							<button aria-label={`React to ${message}`}>Add reaction</button>
						</div>
					</div>
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

it('tabs through message controls and then moves to the composer', async () => {
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
	expect(screen.getByRole('listitem', { name: 'msg2' })).toHaveFocus();
	await user.tab();
	await user.tab();
	expect(screen.getByRole('button', { name: 'React to msg2' })).toHaveFocus();

	await user.tab();
	expect(screen.getByRole('textbox', { name: 'Message composer' })).toHaveFocus();
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
