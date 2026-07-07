import { useCallback } from 'react';
import type { KeyboardEvent, RefObject } from 'react';
import type { GroupedVirtuosoHandle } from 'react-virtuoso';

export const useMembersListNavigation = (virtuosoRef: RefObject<GroupedVirtuosoHandle | null>) => {
	const onKeyDown = useCallback(
		(e: KeyboardEvent<HTMLElement>) => {
			if (!(e.target instanceof Element) || !e.target.classList.contains('rcx-option')) return;
			if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

			e.preventDefault();
			e.stopPropagation();

			const node = e.currentTarget;
			const wrapper = (e.target as HTMLElement).closest<HTMLElement>('[data-item-index][data-item-group-index]');
			const currentIndex = parseInt(wrapper?.dataset.itemIndex ?? '-1', 10);
			if (currentIndex === -1) return;

			const targetIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;

			const focusItem = () => {
				node
					.querySelector<HTMLElement>(`[data-item-index="${targetIndex}"][data-item-group-index]`)
					?.querySelector<HTMLElement>('.rcx-option[tabindex="0"]')
					?.focus();
			};

			const nextWrapper = node.querySelector<HTMLElement>(`[data-item-index="${targetIndex}"][data-item-group-index]`);
			if (nextWrapper) {
				nextWrapper.querySelector<HTMLElement>('.rcx-option[tabindex="0"]')?.focus();
			} else {
				virtuosoRef.current?.scrollToIndex({ index: targetIndex, behavior: 'auto' });
				requestAnimationFrame(focusItem);
			}
		},
		[virtuosoRef],
	);

	return { onKeyDown };
};
