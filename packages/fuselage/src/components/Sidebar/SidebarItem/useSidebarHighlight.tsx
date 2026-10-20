import { useContext, type ReactNode } from 'react';

import { ItemHighlightContext } from '../../Item/ItemContext';

/**
 * Emphasizes one part of a row, such as an unread title, with the sidebar's own color.
 * A highlighted row's emphasis wins, and the part's children keep the row's.
 */
export const useSidebarHighlight = (highlighted: boolean | undefined) => {
	const rowHighlight = useContext(ItemHighlightContext);
	const partHighlight = rowHighlight ?? (highlighted ? 'sidebar' : undefined);

	return {
		wrapPart: (part: ReactNode) => <ItemHighlightContext.Provider value={partHighlight}>{part}</ItemHighlightContext.Provider>,
		wrapChildren: (children: ReactNode) => <ItemHighlightContext.Provider value={rowHighlight}>{children}</ItemHighlightContext.Provider>,
	};
};
