import { composeStories } from '@storybook/react-webpack5';
import { fireEvent, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import Button from './Button';
import * as stories from './Button.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Button Component]', () => {
	it('renders Button without crashing', () => {
		render(<Default />);
	});

	it('should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[Button as a link]', () => {
	it.each([
		['disabled', { disabled: true }],
		['loading', { loading: true }],
	])('does not navigate or call onClick while %s', (_state, stateProps) => {
		const onClick = jest.fn();
		render(
			<Button is='a' href='https://rocket.chat' onClick={onClick} {...stateProps}>
				Link
			</Button>,
		);

		const link = screen.getByText('Link').closest('a') as HTMLAnchorElement;
		expect(link).not.toHaveAttribute('href');
		expect(link).toHaveAttribute('aria-disabled', 'true');
		expect(link).toHaveAttribute('tabindex', '-1');

		fireEvent.click(link);
		expect(onClick).not.toHaveBeenCalled();
	});

	it('navigates and calls onClick when enabled', () => {
		const onClick = jest.fn();
		render(
			<Button is='a' href='https://rocket.chat' onClick={onClick}>
				Link
			</Button>,
		);

		const link = screen.getByRole('link', { name: 'Link' });
		expect(link).toHaveAttribute('href', 'https://rocket.chat');
		expect(link).not.toHaveAttribute('aria-disabled');

		fireEvent.click(link);
		expect(onClick).toHaveBeenCalledTimes(1);
	});
});
