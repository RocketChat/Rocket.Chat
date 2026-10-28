import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
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

	it('should keep the rel passed to a link', () => {
		render(
			<Button is='a' href='/somewhere' external rel='nofollow'>
				Go
			</Button>,
		);
		expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('rel', 'nofollow');
	});

	it('should default the rel of an external link', () => {
		render(
			<Button is='a' href='/somewhere' external>
				Go
			</Button>,
		);
		expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute('rel', 'noopener noreferrer');
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
