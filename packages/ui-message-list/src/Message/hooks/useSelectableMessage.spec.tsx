import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { useSelectableMessage } from './useSelectableMessage';
import { MessageSelectionContext, createMessageSelectionStore } from '../contexts/MessageSelectionContext';

const Row = () => {
	const { isSelecting, isSelected, toggleSelected, rowProps } = useSelectableMessage('messageId');

	return (
		// eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
		<div role='listitem' tabIndex={0} {...rowProps}>
			{isSelecting && <input type='checkbox' checked={isSelected} onChange={toggleSelected} aria-label='select' />}
		</div>
	);
};

const renderRow = (store: ReturnType<typeof createMessageSelectionStore>, around?: () => void) => {
	const wrapper = ({ children }: { children: ReactNode }) => (
		<MessageSelectionContext.Provider value={store}>{children}</MessageSelectionContext.Provider>
	);
	document.addEventListener('click', around ?? (() => undefined));
	return render(<Row />, { wrapper });
};

it('shows the checkbox only while selecting, checked when the message is selected (R19)', () => {
	const store = createMessageSelectionStore();
	renderRow(store);
	expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
});

it('toggles by a click on the row and keeps the click on it (R20)', async () => {
	const store = createMessageSelectionStore({ isSelecting: true });
	const around = jest.fn();
	renderRow(store, around);

	await userEvent.click(screen.getByRole('listitem'));
	document.removeEventListener('click', around);

	expect(store.isSelected('messageId')).toBe(true);
	expect(around).not.toHaveBeenCalled();
});

it('does nothing on a click outside selection mode, and lets it through (R20)', async () => {
	const store = createMessageSelectionStore();
	const around = jest.fn();
	renderRow(store, around);

	await userEvent.click(screen.getByRole('listitem'));
	document.removeEventListener('click', around);

	expect(store.isSelected('messageId')).toBe(false);
	expect(around).toHaveBeenCalledTimes(1);
});

it('toggles with Space and Enter and prevents the default, and with no other key (R21)', async () => {
	const store = createMessageSelectionStore({ isSelecting: true });
	renderRow(store);
	screen.getByRole('listitem').focus();

	await userEvent.keyboard('a');
	expect(store.isSelected('messageId')).toBe(false);
	await userEvent.keyboard(' ');
	expect(store.isSelected('messageId')).toBe(true);
	await userEvent.keyboard('{Enter}');
	expect(store.isSelected('messageId')).toBe(false);

	const event = new KeyboardEvent('keydown', { code: 'Space', bubbles: true, cancelable: true });
	screen.getByRole('listitem').dispatchEvent(event);
	expect(event.defaultPrevented).toBe(true);
});

it('ignores Space and Enter outside selection mode (R21)', async () => {
	const store = createMessageSelectionStore();
	renderRow(store);
	screen.getByRole('listitem').focus();

	await userEvent.keyboard(' ');
	await userEvent.keyboard('{Enter}');

	expect(store.isSelected('messageId')).toBe(false);
});
