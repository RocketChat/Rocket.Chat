import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { messageParser } from '../surfaces';

it('renders a header block as a heading with its text', () => {
	render(
		<MockedServerContext>{messageParser.render([{ type: 'header', text: { type: 'plain_text', text: 'Budget' } }])}</MockedServerContext>,
	);

	expect(screen.getByRole('heading', { name: 'Budget' })).toBeInTheDocument();
});
