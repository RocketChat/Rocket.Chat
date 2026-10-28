import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

export type TableColumn<TKey extends string> = {
	key: TKey;
	disabled?: boolean;
};

export type TableColumns<TKey extends string> = {
	isVisible: (key: TKey) => boolean;
	isDisabled: (key: TKey) => boolean;
	toggle: (key: TKey) => void;
	visibleCount: number;
};

/**
 * Which of a table's columns this browser was told to leave out, so the choice outlives a reload.
 */
export const useTableColumns = <TKey extends string>(storageKey: string, columns: readonly TableColumn<TKey>[]): TableColumns<TKey> => {
	const [hidden, setHidden] = useLocalStorage<TKey[]>(storageKey, []);

	const isDisabled = useCallback((key: TKey) => columns.some((column) => column.key === key && column.disabled), [columns]);

	const isVisible = useCallback((key: TKey) => isDisabled(key) || !hidden.includes(key), [hidden, isDisabled]);

	const toggle = useCallback(
		(key: TKey) => {
			if (isDisabled(key)) {
				return;
			}

			setHidden((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
		},
		[isDisabled, setHidden],
	);

	return { isVisible, isDisabled, toggle, visibleCount: columns.filter(({ key }) => isVisible(key)).length };
};
