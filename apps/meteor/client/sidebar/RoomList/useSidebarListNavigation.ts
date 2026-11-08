import { useItemListNavigation } from '../../hooks/useItemListNavigation';

const isSidebarRow = (node: Element) =>
	(node.classList.contains('rcx-item__link') && !!node.closest('[role="listitem"]')) || node.classList.contains('rcx-item-group-title');

/**
 * Gives a sidebar room list the keyboard model of the other lists, with its group titles as rows.
 */
export const useSidebarListNavigation = () => useItemListNavigation({ isItem: isSidebarRow });
