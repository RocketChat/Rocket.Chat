import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { modalParser } from '../surfaces';

const users = [
	{ _id: 'u1', username: 'rocket.cat', name: 'Rocket Cat' },
	{ _id: 'u2', username: 'john.doe', name: 'John Doe' },
];

it('stops offering users once max_selected_items are selected', async () => {
	render(
		<>
			{modalParser.render([
				{
					type: 'input',
					label: { type: 'plain_text', text: 'Owners' },
					element: {
						type: 'multi_users_select',
						appId: 'app',
						blockId: 'block',
						actionId: 'owners',
						initial_users: ['rocket.cat'],
						max_selected_items: 1,
					},
				},
			])}
		</>,
		{
			wrapper: mockAppRoot()
				.withEndpoint('GET', '/v1/users.autocomplete', () => ({ items: users }) as any)
				.build(),
		},
	);

	expect(await screen.findByText('Rocket Cat')).toBeInTheDocument();
	await userEvent.click(screen.getByRole('textbox'));

	expect(screen.queryByRole('option', { name: 'John Doe' })).not.toBeInTheDocument();
});
