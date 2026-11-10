import type { Value } from './literal.mts';

// A Text is an inline, pre-wrapped span where a View is a column flex div: what a frame doesn't state stays a View's
const viewDefaults: Record<string, Value> = {
	render: 'div',
	display: 'flex',
	alignItems: 'stretch',
	flexDirection: 'column',
	flexBasis: 'auto',
	flexShrink: 0,
	minWidth: 0,
	minHeight: 0,
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
};

/** The View defaults a `styled(Text, …)` frame has to restate, minus the properties the frame states itself. */
export const textFrameDefaults = (style: Record<string, Value>): Record<string, Value> =>
	Object.fromEntries(Object.entries(viewDefaults).filter(([key]) => !Object.hasOwn(style, key)));
