import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { messageParser } from '../surfaces';

it('renders the markdown of a markdown block', async () => {
	render(
		<MockedServerContext>
			{messageParser.render([{ type: 'markdown', text: '**Release notes**\n\n- faster search\n- [docs](https://docs.rocket.chat)' }])}
		</MockedServerContext>,
	);

	expect(await screen.findByText('Release notes')).toBeInTheDocument();
	expect(screen.getByText('faster search')).toBeInTheDocument();
	expect(screen.getByRole('link')).toHaveAttribute('href', 'https://docs.rocket.chat/');
});
