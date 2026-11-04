import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';

import { messageParser } from '../surfaces';

const wrapper = () =>
	mockAppRoot()
		.withEndpoint('GET', '/v1/users.info', ({ userId }: any) => ({ user: { _id: userId, username: `user-${userId}` } }) as any)
		.withEndpoint('GET', '/v1/rooms.info', ({ roomId }: any) => ({ room: { _id: roomId, name: `room-${roomId}`, t: 'c' } }) as any)
		.build();

it('renders styled text, lists, quotes and code, and resolves mentions by id', async () => {
	render(
		<>
			{messageParser.render([
				{
					type: 'rich_text',
					elements: [
						{
							type: 'rich_text_section',
							elements: [
								{ type: 'text', text: 'Hello ', style: { bold: true } },
								{ type: 'user', user_id: 'u1' },
								{ type: 'text', text: ' in ' },
								{ type: 'channel', channel_id: 'c1' },
								{ type: 'text', text: ' ' },
								{ type: 'link', url: 'https://docs.rocket.chat', text: 'docs' },
							],
						},
						{
							type: 'rich_text_list',
							style: 'bullet',
							elements: [
								{ type: 'rich_text_section', elements: [{ type: 'text', text: 'first' }] },
								{ type: 'rich_text_section', elements: [{ type: 'text', text: 'second' }] },
							],
						},
						{ type: 'rich_text_quote', elements: [{ type: 'text', text: 'quoted' }] },
						{ type: 'rich_text_preformatted', elements: [{ type: 'text', text: 'let a = 1' }] },
					],
				},
			])}
		</>,
		{ wrapper: wrapper() },
	);

	await waitFor(() =>
		expect(screen.getByText('Hello', { exact: false }).parentElement).toHaveTextContent('Hello @user-u1 in #room-c1 docs'),
	);
	expect(screen.getByText('Hello')).toBeInTheDocument();
	expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['first', 'second']);
	expect(screen.getByText('quoted')).toBeInTheDocument();
	expect(document.querySelector('pre code')).toHaveTextContent('let a = 1');
	expect(screen.getByRole('link')).toHaveAttribute('href', 'https://docs.rocket.chat/');
});

it('shows the id of a mention until its name loads', () => {
	render(
		<>
			{messageParser.render([
				{ type: 'rich_text', elements: [{ type: 'rich_text_section', elements: [{ type: 'user', user_id: 'u1' }] }] },
			])}
		</>,
		{ wrapper: wrapper() },
	);

	expect(screen.getByText('u1', { exact: false }).parentElement).toHaveTextContent('@u1');
});
