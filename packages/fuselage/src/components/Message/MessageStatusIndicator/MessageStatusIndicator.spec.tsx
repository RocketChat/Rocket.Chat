import { screen } from '@testing-library/react';

import { MessageStatusIndicator, MessageStatusIndicatorItem } from './index.js';
import { render } from '../../../testing.js';

it('renders without crashing', () => {
	render(
		<MessageStatusIndicator>
			<MessageStatusIndicatorItem name='star' />
		</MessageStatusIndicator>,
	);
});

it('names a titled status for assistive technology and hides an untitled one', () => {
	render(
		<MessageStatusIndicator>
			<MessageStatusIndicatorItem name='pin' title='Message has been pinned' />
			<MessageStatusIndicatorItem name='key' data-testid='decorative' />
		</MessageStatusIndicator>,
	);

	expect(screen.getByRole('img', { name: 'Message has been pinned' })).toBeInTheDocument();
	expect(screen.getByTestId('decorative')).toHaveAttribute('aria-hidden', 'true');
});
