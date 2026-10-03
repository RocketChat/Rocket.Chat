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

it('renders the custom status and bio it is given', () => {
	render(<UserCard user={{ name: 'Jane', username: 'jane', customStatus: <em>Out of office</em>, bio: <strong>Rendered bio</strong> }} />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.getByText('Out of office').tagName).toBe('EM');
	expect(screen.getByText('Rendered bio').tagName).toBe('STRONG');
});
