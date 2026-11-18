import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';

import PaginatedMultiSelect from './PaginatedMultiSelect';
import PaginatedMultiSelectFiltered from './PaginatedMultiSelectFiltered';
import { PaginatedSelect } from './PaginatedSelect';
import PaginatedSelectFiltered from './PaginatedSelectFiltered';

const options = [{ value: '1', label: 'Apple' }];

describe.each<[string, ComponentType<any>, string, Record<string, unknown>]>([
	['PaginatedSelect', PaginatedSelect, 'button', {}],
	['PaginatedSelectFiltered', PaginatedSelectFiltered, 'textbox', { setFilter: jest.fn() }],
	['PaginatedMultiSelect', PaginatedMultiSelect, 'button', {}],
	['PaginatedMultiSelectFiltered', PaginatedMultiSelectFiltered, 'textbox', { setFilter: jest.fn() }],
])('[%s Component]', (_name, Component, role, extraProps) => {
	it('should label and describe its focusable control', () => {
		render(
			<>
				<span id='label'>Fruit</span>
				<Component
					aria-labelledby='label'
					aria-describedby='hint'
					aria-invalid
					placeholder='Pick one'
					options={options}
					{...extraProps}
					onChange={jest.fn()}
				/>
				<span id='hint'>Required field</span>
			</>,
		);

		const control = screen.getByRole(role, { name: 'Fruit' });
		expect(control).toHaveAccessibleDescription('Required field');
		expect(control).toHaveAttribute('aria-invalid', 'true');
	});

	it('should focus its control when the label pointing to its id is clicked', async () => {
		render(
			<>
				<label htmlFor='fruit'>Fruit</label>
				<Component id='fruit' placeholder='Pick one' options={options} {...extraProps} onChange={jest.fn()} />
			</>,
		);

		const control = screen.getByLabelText('Fruit');
		expect(control).toHaveAttribute('id', 'fruit');
		expect(control).toHaveRole(role);

		await userEvent.click(screen.getByText('Fruit'));
		expect(control).toHaveFocus();
	});
});
