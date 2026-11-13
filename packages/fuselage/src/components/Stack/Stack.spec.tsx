import { composeStories } from '@storybook/react';
import { screen } from '@testing-library/react';

import * as stories from './Stack.stories';
import { render } from '../../testing';

const { Default, Row, List, Form, Inline } = composeStories(stories);

describe('[Stack Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);

		expect(screen.getByText('One')).toBeInTheDocument();
	});

	it('lays out a column by default', () => {
		render(<Default data-testid='stack' />);
		expect(screen.getByTestId('stack').tagName).toBe('DIV');
		expect(getComputedStyle(screen.getByTestId('stack'))).toMatchObject({ display: 'flex', flexDirection: 'column' });
	});

	it('maps align and justify to flex values', () => {
		render(<Row data-testid='stack' />);
		expect(getComputedStyle(screen.getByTestId('stack'))).toMatchObject({
			flexDirection: 'row',
			alignItems: 'flex-start',
			justifyContent: 'space-between',
		});
	});

	it('renders a list without markers', () => {
		render(<List />);
		const list = screen.getByRole('list', { name: 'Fruits' });
		expect(list).toHaveClass('rcx-stack--list');
		expect(screen.getAllByRole('listitem')).toHaveLength(2);
	});

	it('renders a form around a fieldset group', () => {
		render(<Form />);
		expect(screen.getByRole('form', { name: 'Profile' })).toBeInTheDocument();
		expect(screen.getByRole('group', { name: 'Account' })).toHaveClass('rcx-stack--fieldset');
	});

	it('renders an inline element', () => {
		render(<Inline />);
		expect(screen.getByText('Send the transcript').tagName).toBe('SPAN');
	});

	it('adds no class of its own to other elements', () => {
		const { container } = render(<Default />);
		expect(container.firstElementChild?.className).not.toMatch(/rcx-stack/);
	});
});
