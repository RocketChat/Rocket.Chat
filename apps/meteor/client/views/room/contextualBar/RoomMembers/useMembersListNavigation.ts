import { useCallback } from 'react';
import type { KeyboardEvent } from 'react';

export const useMembersListNavigation = () => {
	const onKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
		if (!(e.target instanceof Element) || !e.target.classList.contains('rcx-option')) return;
		if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

		e.preventDefault();
		e.stopPropagation();

		const node = e.currentTarget;
		const wrapper = (e.target as HTMLElement).closest<HTMLElement>('[data-item-index][data-item-group-index]');
		const currentIndex = parseInt(wrapper?.dataset.itemIndex ?? '-1', 10);
		if (currentIndex === -1) return;

		const targetIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
		const nextWrapper = node.querySelector<HTMLElement>(`[data-item-index="${targetIndex}"][data-item-group-index]`);
		nextWrapper?.querySelector<HTMLElement>('.rcx-option[tabindex="0"]')?.focus();
	}, []);

	return { onKeyDown };
};
