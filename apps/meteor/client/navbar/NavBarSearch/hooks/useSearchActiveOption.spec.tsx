import { useOverlayTriggerState } from '@react-stately/overlays';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SearchActiveOptionContext, useSearchActiveOption, useSearchOptionProps, useSyncSearchOptions } from './useSearchActiveOption';

import '@testing-library/jest-dom';

const Option = ({ id, onClick }: { id: string; onClick?: () => void }) => {
	const { focusVisible, onPointerMove, tabIndex, 'aria-selected': selected } = useSearchOptionProps(id);

	return (
		// oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- the combobox handles the keyboard for its options
		<div
			role='option'
			id={id}
			tabIndex={tabIndex}
			aria-selected={selected}
			data-focus-visible={focusVisible}
			onPointerMove={onPointerMove}
			onClick={onClick}
		>
			{id}
		</div>
	);
};

const Listbox = ({ ids, onSelect }: { ids: string[]; onSelect: (id: string) => void }) => {
	useSyncSearchOptions(ids);

	return (
		<div id='listbox' role='listbox'>
			{ids.map((id) => (
				<Option key={id} id={id} onClick={() => onSelect(id)} />
			))}
		</div>
	);
};

type SearchProps = { onSelect: (id: string) => void; ids?: string[]; defaultOpen?: boolean };

const Search = ({ onSelect, ids = ['first', 'second'], defaultOpen = true }: SearchProps) => {
	const state = useOverlayTriggerState({ defaultOpen });
	const { activeId, handleKeyDown, handleInput, contextValue } = useSearchActiveOption(state, 'listbox');

	return (
		<>
			<input
				role='combobox'
				aria-label='Search'
				aria-controls='listbox'
				aria-expanded={state.isOpen}
				aria-activedescendant={activeId}
				onKeyDown={handleKeyDown}
				onInput={handleInput}
			/>
			<SearchActiveOptionContext.Provider value={contextValue}>
				{state.isOpen && <Listbox ids={ids} onSelect={onSelect} />}
			</SearchActiveOptionContext.Provider>
		</>
	);
};

beforeAll(() => {
	Element.prototype.scrollIntoView = jest.fn();
});

describe('useSearchActiveOption', () => {
	it('should start with no active option', () => {
		render(<Search onSelect={jest.fn()} />);

		expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-activedescendant');
	});

	it('should move the active option with the arrows while focus stays on the combobox', async () => {
		const user = userEvent.setup();
		render(<Search onSelect={jest.fn()} />);
		const combobox = screen.getByRole('combobox');

		await user.click(combobox);
		await user.keyboard('{ArrowDown}');
		expect(combobox).toHaveAttribute('aria-activedescendant', 'first');
		expect(screen.getByRole('option', { name: 'first' })).toHaveAttribute('aria-selected', 'true');
		expect(screen.getByRole('option', { name: 'first' })).toHaveAttribute('data-focus-visible', 'true');

		await user.keyboard('{ArrowDown}{ArrowDown}');
		expect(combobox).toHaveAttribute('aria-activedescendant', 'first');

		await user.keyboard('{ArrowUp}');
		expect(combobox).toHaveAttribute('aria-activedescendant', 'second');
		expect(combobox).toHaveFocus();
	});

	it('should start from the last option on ArrowUp', async () => {
		const user = userEvent.setup();
		render(<Search onSelect={jest.fn()} />);

		await user.click(screen.getByRole('combobox'));
		await user.keyboard('{ArrowUp}');

		expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', 'second');
	});

	it('should make the option under the pointer active without its focus ring', async () => {
		const user = userEvent.setup();
		render(<Search onSelect={jest.fn()} />);

		await user.click(screen.getByRole('combobox'));
		await user.keyboard('{ArrowDown}');
		await user.hover(screen.getByRole('option', { name: 'second' }));

		expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', 'second');
		expect(screen.getByRole('option', { name: 'second' })).toHaveAttribute('data-focus-visible', 'false');
		expect(screen.getByRole('option', { name: 'first' })).toHaveAttribute('aria-selected', 'false');
	});

	it('should clear the active option when typing', async () => {
		const user = userEvent.setup();
		render(<Search onSelect={jest.fn()} />);
		const combobox = screen.getByRole('combobox');

		await user.click(combobox);
		await user.keyboard('{ArrowDown}');
		await user.type(combobox, 'a');

		expect(combobox).not.toHaveAttribute('aria-activedescendant');
	});

	it('should select the active option on Enter', async () => {
		const user = userEvent.setup();
		const onSelect = jest.fn();
		render(<Search onSelect={onSelect} />);

		await user.click(screen.getByRole('combobox'));
		await user.keyboard('{Enter}');
		expect(onSelect).not.toHaveBeenCalled();

		await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
		expect(onSelect).toHaveBeenCalledWith('second');
	});

	it('should clear the active option when its result disappears', async () => {
		const user = userEvent.setup();
		const { rerender } = render(<Search onSelect={jest.fn()} />);
		const combobox = screen.getByRole('combobox');

		await user.click(combobox);
		await user.keyboard('{ArrowDown}');
		expect(combobox).toHaveAttribute('aria-activedescendant', 'first');

		rerender(<Search onSelect={jest.fn()} ids={['second']} />);

		expect(combobox).not.toHaveAttribute('aria-activedescendant');
	});

	it('should activate an option on the arrow key that reopens the list', async () => {
		const user = userEvent.setup();
		render(<Search onSelect={jest.fn()} defaultOpen={false} />);
		const combobox = screen.getByRole('combobox');

		combobox.focus();
		await user.keyboard('{ArrowDown}');

		expect(combobox).toHaveAttribute('aria-activedescendant', 'first');
	});
});
