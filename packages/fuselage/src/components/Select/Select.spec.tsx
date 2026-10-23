import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Section } from 'react-stately';

import * as stories from './Select.stories';
import { Item, SelectAria } from './SelectAria';
import { withResizeObserverMock } from '../../../mocks/withResizeObserverMock';
import { render } from '../../testing';

const { Default } = composeStories(stories);

withResizeObserverMock();

describe('[Select Component]', () => {
	it('%s should have no a11y violations', async () => {
		const { container } = render(<Default />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should render listbox sections with `Item` group parts', async () => {
		render(
			<SelectAria aria-label='Fruit' placeholder='Fruit'>
				<Section key='citrus' title='Citrus'>
					<Item key='lemon'>Lemon</Item>
					<Item key='orange'>Orange</Item>
				</Section>
			</SelectAria>,
		);

		await userEvent.click(screen.getByRole('button'));

		const group = await screen.findByRole('group', { name: 'Citrus' });
		expect(group).toHaveClass('rcx-item-group');
		expect(screen.getByText('Citrus')).toHaveClass('rcx-item-group-title');
		expect(screen.getByText('Citrus').closest('.rcx-item-group-header')).not.toBe(null);
		expect(screen.getAllByRole('option')).toHaveLength(2);

		const results = await axe(group);
		expect(results).toHaveNoViolations();
	});
});
