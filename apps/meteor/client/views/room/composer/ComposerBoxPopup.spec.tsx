import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { UseQueryResult } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import ComposerBoxPopupComponent from './ComposerBoxPopup';
import type { ComposerBoxPopupProps } from './ComposerBoxPopup';

import '@testing-library/jest-dom';

type Item = { _id: string; label: string; disabled?: boolean };

// `memo` drops the component's type parameter.
const ComposerBoxPopup = ComposerBoxPopupComponent as unknown as (props: ComposerBoxPopupProps<Item>) => ReactElement;

const first = { _id: 'first', label: 'First' };
const second = { _id: 'second', label: 'Second' };
const items = [{ isSuccess: true, isLoading: false, data: [first, second] } as unknown as UseQueryResult<Item[]>];

const renderPopup = (props: Partial<ComposerBoxPopupProps<Item>> = {}) =>
	render(
		<ComposerBoxPopup
			title='People'
			listboxId='popup-listbox'
			items={items}
			focused={first}
			select={jest.fn()}
			renderItem={({ item }) => <>{item.label}</>}
			{...props}
		/>,
		{ wrapper: mockAppRoot().build() },
	);

beforeAll(() => {
	Element.prototype.scrollIntoView = jest.fn();
});

describe('ComposerBoxPopup', () => {
	it('should name the listbox the combobox controls', () => {
		renderPopup();

		expect(screen.getByRole('listbox', { name: 'People' })).toHaveAttribute('id', 'popup-listbox');
	});

	it('should name an untitled listbox', () => {
		renderPopup({ title: undefined });

		expect(screen.getByRole('listbox', { name: 'Results' })).toBeInTheDocument();
	});

	it('should mark the active option as selected', () => {
		renderPopup();

		expect(screen.getByRole('option', { name: 'First' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('option', { name: 'Second' })).toHaveAttribute('aria-selected', 'false');
	});

	it('should ring the active option only while the keyboard drives the list', () => {
		const { rerender } = renderPopup({ focusVisible: false });
		expect(screen.getByRole('option', { name: 'First' })).not.toHaveClass('rcx-item--focus-visible');

		rerender(
			<ComposerBoxPopup
				title='People'
				listboxId='popup-listbox'
				items={items}
				focused={first}
				focusVisible
				select={jest.fn()}
				renderItem={({ item }) => <>{item.label}</>}
			/>,
		);
		expect(screen.getByRole('option', { name: 'First' })).toHaveClass('rcx-item--focus-visible');
		expect(screen.getByRole('option', { name: 'Second' })).not.toHaveClass('rcx-item--focus-visible');
	});

	it('should make the option under the pointer active', async () => {
		const hover = jest.fn();
		renderPopup({ hover });

		await userEvent.hover(screen.getByRole('option', { name: 'Second' }));

		expect(hover).toHaveBeenCalledWith(second);
	});

	it('should not make a disabled option active under the pointer', async () => {
		const hover = jest.fn();
		const disabled = { _id: 'disabled', label: 'Disabled', disabled: true };
		renderPopup({ hover, items: [{ isSuccess: true, isLoading: false, data: [first, disabled] } as unknown as UseQueryResult<Item[]>] });

		await userEvent.hover(screen.getAllByRole('option')[1]);

		expect(hover).not.toHaveBeenCalled();
	});
});
