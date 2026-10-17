import { act, renderHook } from '@testing-library/react';

import { useTableColumns } from './useTableColumns';

const COLUMNS = [{ key: 'name', disabled: true }, { key: 'email' }, { key: 'company' }] as const;

const renderFor = (storageKey: string) => renderHook(() => useTableColumns(storageKey, COLUMNS));

describe('useTableColumns', () => {
	beforeEach(() => window.localStorage.clear());

	it('shows every column that was not turned off', () => {
		const { result } = renderFor('a-table');

		expect(COLUMNS.every(({ key }) => result.current.isVisible(key))).toBe(true);
	});

	it('hides the column the menu turned off, and brings it back', () => {
		const { result } = renderFor('a-table');

		act(() => result.current.toggle('company'));
		expect(result.current.isVisible('company')).toBe(false);

		act(() => result.current.toggle('company'));
		expect(result.current.isVisible('company')).toBe(true);
	});

	it('still shows a disabled column when trying to toggle it', () => {
		const { result } = renderFor('a-table');

		act(() => result.current.toggle('name'));

		expect(result.current.isVisible('name')).toBe(true);
		expect(result.current.isDisabled('name')).toBe(true);
	});

	it('stores nothing for a locked column, which would hide it the day it stops being locked', () => {
		const { result: locked, unmount } = renderFor('a-table');

		act(() => locked.current.toggle('name'));
		unmount();

		const { result: unlocked } = renderHook(() => useTableColumns('a-table', [{ key: 'name' }, { key: 'email' }] as const));

		expect(unlocked.current.isVisible('name')).toBe(true);
	});

	it('remembers the choice for a table mounted again later', () => {
		const { result, unmount } = renderFor('a-table');

		act(() => result.current.toggle('company'));
		unmount();

		const { result: remounted } = renderFor('a-table');

		expect(remounted.current.isVisible('company')).toBe(false);
	});

	it('keeps one table choice out of another, which is what the storage key is for', () => {
		const { result: contacts } = renderFor('contacts-table');
		const { result: calls } = renderFor('calls-table');

		act(() => contacts.current.toggle('company'));

		expect(contacts.current.isVisible('company')).toBe(false);
		expect(calls.current.isVisible('company')).toBe(true);
	});
});
