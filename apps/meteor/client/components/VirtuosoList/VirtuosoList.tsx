import { forwardRef } from 'react';
import type { ListProps } from 'react-virtuoso';

export type VirtuosoListContext = {
	'aria-label': string;
};

/**
 * The `List` of a Virtuoso list: a `role=list` named by the `aria-label` in the Virtuoso `context`.
 */
export const VirtuosoList = forwardRef<HTMLDivElement, ListProps & { context?: VirtuosoListContext }>(function VirtuosoList(
	{ context, ...props },
	ref,
) {
	return <div role='list' aria-label={context?.['aria-label']} ref={ref} {...props} />;
});
