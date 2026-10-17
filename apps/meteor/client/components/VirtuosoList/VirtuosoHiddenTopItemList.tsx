import type { TopItemListProps } from 'react-virtuoso';

/**
 * The `TopItemList` of a `GroupedVirtuoso` list whose group headers hold no controls. Virtuoso renders the sticky header
 * in a second copy of the `List`, so this hides that copy from assistive technology, which reads the header in the list
 * itself. Do not use it when the headers are interactive, as focusable content must not be hidden.
 */
export const VirtuosoHiddenTopItemList = ({ context: _context, ...props }: TopItemListProps & { context?: unknown }) => (
	<div aria-hidden {...props} />
);
