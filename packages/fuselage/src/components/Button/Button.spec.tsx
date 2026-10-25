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

	it('should render a button of type button by default', () => {
		render(<Button>Save</Button>);
		expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
	});

	it('should render a link without a type when is is a', () => {
		render(
			<Button is='a' href='/somewhere'>
				Go
			</Button>,
		);
		expect(screen.getByRole('link', { name: 'Go' })).not.toHaveAttribute('type');
	});
});

describe('[Button as a link]', () => {
	it.each([
		['disabled', { disabled: true }],
		['loading', { loading: true }],
	])('does not navigate or call click handlers while %s', (_state, stateProps) => {
		const onClick = jest.fn();
		const onClickCapture = jest.fn();
		render(
			<Button is='a' href='https://rocket.chat' onClick={onClick} onClickCapture={onClickCapture} {...stateProps}>
				Link
			</Button>,
		);

		const link = screen.getByRole('link', { name: 'Link' });
		expect(link).not.toHaveAttribute('href');
		expect(link).toHaveAttribute('aria-disabled', 'true');
		expect(link).toHaveAttribute('tabindex', '-1');

		fireEvent.click(link);
		expect(onClick).not.toHaveBeenCalled();
		expect(onClickCapture).not.toHaveBeenCalled();
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
