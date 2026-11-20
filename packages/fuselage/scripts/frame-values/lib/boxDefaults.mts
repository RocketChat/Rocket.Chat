import type { Value } from './literal.mts';

/** What a `styled(View, …)` frame restates to lay out as the plain element it replaces instead of as a column flex item. */
export const boxDefaults: Record<string, Value> = {
	flexDirection: 'row',
	alignItems: 'normal',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
};
