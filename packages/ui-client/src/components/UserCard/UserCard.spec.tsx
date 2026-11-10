import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import UserCard from './UserCard';

it('does not take focus when it mounts', () => {
	render(
		<>
			<input aria-label='composer' />
			<UserCard user={{ name: 'Jane', username: 'jane' }} />
		</>,
		{ wrapper: mockAppRoot().build() },
	);

	const composer = screen.getByRole('textbox', { name: 'composer' });
	composer.focus();

	// a card shown on hover appears while the user is doing something else
	render(<UserCard user={{ name: 'John', username: 'john' }} />, { wrapper: mockAppRoot().build() });

	expect(composer).toHaveFocus();
	expect(screen.getAllByRole('dialog')).toHaveLength(2);
});

it('leaves out the details list when there is nothing to list', () => {
	render(<UserCard user={{ name: 'bruno.admin', username: 'bruno.admin' }} />, { wrapper: mockAppRoot().build() });

	const dialog = screen.getByRole('dialog');
	expect(dialog.querySelector('dl')).toBeNull();
});
