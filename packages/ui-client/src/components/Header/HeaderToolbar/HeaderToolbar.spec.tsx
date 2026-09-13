import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HeaderToolbar from './HeaderToolbar';
import HeaderToolbarAction from './HeaderToolbarAction';

const renderToolbar = () =>
	render(
		<>
			<button>Before toolbar</button>
			<HeaderToolbar aria-label='Room actions'>
				<HeaderToolbarAction icon='phone' title='Call' />
				<HeaderToolbarAction icon='magnifier' title='Search' />
				<HeaderToolbarAction icon='thread' title='Threads' />
			</HeaderToolbar>
			<button>After toolbar</button>
		</>,
	);

it('navigates between toolbar actions using arrow keys', async () => {
	const user = userEvent.setup();
	renderToolbar();

	await user.tab();
	await user.tab();
	expect(screen.getByRole('button', { name: 'Call' })).toHaveFocus();

	await user.keyboard('{ArrowRight}');
	expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();

	await user.keyboard('{ArrowRight}');
	expect(screen.getByRole('button', { name: 'Threads' })).toHaveFocus();

	await user.keyboard('{ArrowLeft}');
	expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();
});

it.each([
	{ shiftKey: false, boundary: 'Threads' },
	{ shiftKey: true, boundary: 'Call' },
])('prepares focus to leave the toolbar with Tab (shiftKey: $shiftKey)', async ({ shiftKey, boundary }) => {
	const user = userEvent.setup();
	renderToolbar();

	await user.tab();
	await user.tab();
	await user.keyboard('{ArrowRight}');
	const action = screen.getByRole('button', { name: 'Search' });
	expect(action).toHaveFocus();

	// React Aria focuses the toolbar boundary before the browser's default Tab action.
	// user-event calculates the Tab destination before keydown, so test the handler in isolation.
	const event = createEvent.keyDown(action, { key: 'Tab', shiftKey });
	// eslint-disable-next-line testing-library/prefer-user-event -- Assert the Tab handler before native focus traversal.
	fireEvent(action, event);
	expect(screen.getByRole('button', { name: boundary })).toHaveFocus();
	expect(event.defaultPrevented).toBe(false);
});
