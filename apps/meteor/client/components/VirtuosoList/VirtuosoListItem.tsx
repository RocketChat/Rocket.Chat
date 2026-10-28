import type { ItemProps } from 'react-virtuoso';

/**
 * The `Item` that pairs with `VirtuosoList` when the rows are not list items themselves, so the list owns each row.
 */
export const VirtuosoListItem = ({ item: _item, context: _context, ...props }: ItemProps<unknown> & { context?: unknown }) => (
	<div role='listitem' {...props} />
);
