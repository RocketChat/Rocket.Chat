import { screen } from '@testing-library/react';

import { MessageStatusIndicator, MessageStatusIndicatorItem } from '.';
import { render } from '../../../testing';

it('renders without crashing', () => {
	render(
		<MessageStatusIndicator data-testid='indicator'>
			<MessageStatusIndicatorItem name='star' />
		</MessageStatusIndicator>,
	);
	expect(screen.getByTestId('indicator')).toHaveClass('rcx-message-status-indicator');
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
