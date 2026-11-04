import { render, screen } from '@testing-library/react';

import { UiKitHome as renderHome } from '.';

it('draws the blocks of a home', () => {
	render(
		<>
			{renderHome([
				{ type: 'header', appId: 'app', blockId: 'title', text: { type: 'plain_text', text: 'Your tasks' } },
				{ type: 'section', appId: 'app', blockId: 'body', text: { type: 'mrkdwn', text: 'Nothing pending' } },
			])}
		</>,
	);

	expect(screen.getByText('Your tasks')).toBeInTheDocument();
	expect(screen.getByText('Nothing pending')).toBeInTheDocument();
});
