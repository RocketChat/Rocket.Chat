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

	it('should render a link without a type when is is a', () => {
		render(
			<Button is='a' href='/somewhere'>
				Go
			</Button>,
		);
		expect(screen.getByRole('link', { name: 'Go' })).not.toHaveAttribute('type');
	});
});
