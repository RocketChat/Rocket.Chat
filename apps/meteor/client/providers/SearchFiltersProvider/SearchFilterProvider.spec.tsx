/* eslint-disable no-await-in-loop */
import '@testing-library/jest-dom';
import type { OptionProp } from '@rocket.chat/ui-client';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useContext } from 'react';

import type { SearchFilters } from '../../contexts/SearchFilterContext';
import { SearchFilterContext } from '../../contexts/SearchFilterContext';
import { SearchFilterProvider } from './SearchFilterProvider';

const DropdownTestComponent = () => {
	const { searchFilters, setSearchFilters } = useContext(SearchFilterContext);

	const handleCheckboxChange = (id: string) => {
		setSearchFilters({
			...searchFilters,
			types: searchFilters.types.map((type) => (type.id === id ? { ...type, checked: !type.checked } : type)),
		} as SearchFilters);
	};

	const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchFilters({ ...searchFilters, searchText: e.target.value });
	};

	return (
		<div>
			<input type='text' value={searchFilters.searchText} onChange={handleSearchTextChange} placeholder='Search...' aria-label='Search' />
			{searchFilters.types.map((option) =>
				option.isGroupTitle ? (
					<div key={option.id}>{option.text}</div>
				) : (
					<label key={option.id}>
						<input type='checkbox' checked={option.checked} onChange={() => handleCheckboxChange(option.id)} />
						{option.text}
					</label>
				),
			)}
		</div>
	);
};

describe('SearchFilterProvider', () => {
	test('handles types in context correctly', async () => {
		const initialTypes = [
			{ id: '1', text: 'Type 1', isGroupTitle: false, checked: false },
			{ id: '2', text: 'Type 2', isGroupTitle: false, checked: false },
		] as OptionProp[];

		render(
			<SearchFilterProvider initialState={{ searchText: '', types: initialTypes }}>
				<DropdownTestComponent />
			</SearchFilterProvider>,
		);

		for (const type of initialTypes) {
			const checkbox = await screen.findByLabelText(type.text);
			expect(checkbox).not.toBeChecked();
		}

		const firstCheckbox = await screen.findByLabelText(initialTypes[0].text);
		userEvent.click(firstCheckbox);

		const updatedFirstCheckbox = await screen.findByLabelText(initialTypes[0].text);
		expect(updatedFirstCheckbox).toBeChecked();
	});

	test('handles searchText and types in context correctly', async () => {
		const initialTypes: OptionProp[] = [
			{ id: '1', text: 'Type 1', isGroupTitle: false, checked: false },
			{ id: '2', text: 'Type 2', isGroupTitle: false, checked: false },
		] as OptionProp[];

		render(
			<SearchFilterProvider initialState={{ searchText: '', types: initialTypes }}>
				<DropdownTestComponent />
			</SearchFilterProvider>,
		);

		const searchInput = screen.getByLabelText('Search');
		expect(searchInput).toHaveValue('');

		userEvent.type(searchInput, 'New Search Text');

		expect(searchInput).toHaveValue('New Search Text');
	});
});
