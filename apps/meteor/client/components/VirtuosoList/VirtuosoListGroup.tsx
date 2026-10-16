import type { GroupProps } from 'react-virtuoso';

/**
 * The `Group` of a `GroupedVirtuoso` list, so the list owns each group header as well.
 */
export const VirtuosoListGroup = ({ context: _context, ...props }: GroupProps & { context?: unknown }) => (
	<div role='listitem' {...props} />
);
