import type { Value } from './literal.mts';

// A plain element is a row-direction block that shrinks and sizes to its content, where a View is a column flex that doesn't shrink
const block: Record<string, Value> = {
	display: 'block',
	flexDirection: 'row',
	alignItems: 'normal',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
};

/** What a plain element computes, for the properties a frame doesn't state itself: `style` wins. */
export const webDefaults = (style: Record<string, Value>): Record<string, Value> => ({ ...block, ...style });
