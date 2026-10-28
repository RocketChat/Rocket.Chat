import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';

import Text from './Text';
import * as stories from './Text.stories';
import { render } from '../../testing';

const { Default, Semantic } = composeStories(stories);

describe('[Text Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});

	it('renders a div by default', () => {
		const { container } = render(<Default />);
		expect(container.firstElementChild?.tagName).toBe('DIV');
	});

	it('renders the element passed in is', () => {
		render(<Semantic />);
		expect(screen.getByRole('heading', { level: 2, name: 'Section title' })).toBeInTheDocument();
		expect(screen.getByText('A paragraph under the title.').tagName).toBe('P');
	});

	it('maps its variations to classes', () => {
		render(
			<Text fontScale='p2m' color='hint' truncate className='extra'>
				text
			</Text>,
		);
		expect(screen.getByText('text')).toHaveClass(
			'rcx-text',
			'rcx-text--font-scale-p2m',
			'rcx-text--color-hint',
			'rcx-text--truncate',
			'extra',
		);
	});

	it('adds no variation classes without variations', () => {
		render(<Text>text</Text>);
		expect(screen.getByText('text')).toHaveAttribute('class', 'rcx-text');
	});

	it('forwards DOM attributes', () => {
		render(
			<Text is='label' htmlFor='input' id='label'>
				Name
			</Text>,
		);
		expect(screen.getByText('Name')).toHaveAttribute('for', 'input');
		expect(screen.getByText('Name')).toHaveAttribute('id', 'label');
	});
});
