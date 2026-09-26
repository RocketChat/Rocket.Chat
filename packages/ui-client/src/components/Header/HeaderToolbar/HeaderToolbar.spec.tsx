import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import HeaderToolbar from './HeaderToolbar';
import HeaderToolbarAction from './HeaderToolbarAction';

const setup = () => {
	const user = userEvent.setup();
	render(
		<>
			<button>Before toolbar</button>
			<HeaderToolbar aria-label='Room actions'>
				<HeaderToolbarAction icon='phone' title='Call' />
				<HeaderToolbarAction icon='info' title='Room information' />
				<HeaderToolbarAction icon='thread' title='Threads' />
			</HeaderToolbar>
			<button>After toolbar</button>
		</>,
	);
	return user;
};

it('navigates between toolbar actions using arrow keys', async () => {
	const user = setup();
	await user.tab();
	await user.tab();
	expect(screen.getByRole('button', { name: 'Call' })).toHaveFocus();

	await user.keyboard('{ArrowRight}');
	expect(screen.getByRole('button', { name: 'Room information' })).toHaveFocus();
	await user.keyboard('{ArrowRight}');
	expect(screen.getByRole('button', { name: 'Threads' })).toHaveFocus();
	await user.keyboard('{ArrowLeft}');
	expect(screen.getByRole('button', { name: 'Room information' })).toHaveFocus();
});

it('moves focus outside the toolbar using tab', async () => {
	const user = setup();
	await user.tab();
	await user.tab();
	expect(screen.getByRole('button', { name: 'Call' })).toHaveFocus();

	await user.tab();
	expect(screen.getByRole('button', { name: 'After toolbar' })).toHaveFocus();
});
