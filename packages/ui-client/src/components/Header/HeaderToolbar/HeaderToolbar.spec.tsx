import { render, screen } from '@testing-library/react';
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

it('navigates between toolbar actions using arrow keys and stops at the edges', async () => {
	const user = userEvent.setup();
	renderToolbar();

	await user.tab();
	await user.tab();
	expect(screen.getByRole('button', { name: 'Call' })).toHaveFocus();

	await user.keyboard('{ArrowLeft}');
	expect(screen.getByRole('button', { name: 'Call' })).toHaveFocus();

	await user.keyboard('{ArrowRight}');
	expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();

	await user.keyboard('{ArrowRight}');
	expect(screen.getByRole('button', { name: 'Threads' })).toHaveFocus();

	await user.keyboard('{ArrowRight}');
	expect(screen.getByRole('button', { name: 'Threads' })).toHaveFocus();

	await user.keyboard('{ArrowLeft}');
	expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();
});

it.each([
	{ key: 'Tab', shift: false, target: 'After toolbar' },
	{ key: 'Shift+Tab', shift: true, target: 'Before toolbar' },
])('leaves the toolbar with $key from a middle action', async ({ shift, target }) => {
	const user = userEvent.setup();
	renderToolbar();

	await user.tab();
	await user.tab();
	await user.keyboard('{ArrowRight}');
	expect(screen.getByRole('button', { name: 'Search' })).toHaveFocus();

	await user.tab({ shift });
	expect(screen.getByRole('button', { name: target })).toHaveFocus();
});
