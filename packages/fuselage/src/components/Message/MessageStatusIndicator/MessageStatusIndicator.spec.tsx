import { screen } from '@testing-library/react';

import { MessageStatusIndicator, MessageStatusIndicatorItem } from '.';
import { render } from '../../../testing';

it('renders without crashing', () => {
	render(
		<MessageStatusIndicator>
			<MessageStatusIndicatorItem name='star' />
		</MessageStatusIndicator>,
	);
});

it('renders nothing when there are no status items', () => {
	const { container } = render(
		<MessageStatusIndicator>
			{false}
			{null}
		</MessageStatusIndicator>,
	);

	expect(container).toBeEmptyDOMElement();
});

it('lets a consumer color override the default item color', () => {
	render(
		<MessageStatusIndicator>
			<MessageStatusIndicatorItem name='language' data-testid='default' />
			<MessageStatusIndicatorItem name='language' color='info' data-testid='custom' />
		</MessageStatusIndicator>,
	);

	expect(screen.getByTestId('default')).toHaveStyle({ color: 'var(--rcx-color-font-secondary-info, #6c737a)' });
	expect(screen.getByTestId('custom')).toHaveStyle({ color: 'var(--rcx-color-font-info, #095ad2)' });
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
