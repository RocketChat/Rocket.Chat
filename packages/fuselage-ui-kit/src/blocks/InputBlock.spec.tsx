import { MockedServerContext } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { modalParser } from '../surfaces';

it('labels its element with the block label', () => {
	render(
		<MockedServerContext>
			{modalParser.render([
				{
					type: 'input',
					label: { type: 'plain_text', text: 'Name' },
					element: { type: 'plain_text_input', appId: 'app', blockId: 'block', actionId: 'name' },
				},
			])}
		</MockedServerContext>,
	);

	expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
});
