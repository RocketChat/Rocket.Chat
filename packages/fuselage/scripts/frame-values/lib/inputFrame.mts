import { font } from './frameTokens.mts';
import type { Value } from './literal.mts';
import { size } from '../../../src/styleTokens.ts';

/** The frame of a bare `input`, which `Input` and the filter of a select share before their own shapes. */
export const inputFrame = (): Record<string, Value> => ({
	render: 'input',
	position: 'relative',
	display: 'inline-flex',
	flexDirection: 'row',
	alignItems: 'normal',
	flexGrow: 1,
	flexShrink: 0,
	flexBasis: 'auto',
	width: size('none')!,
	minWidth: size('x128')!,
	minHeight: 'auto',
	userSelect: 'auto',
	verticalAlign: 'baseline',
	whiteSpace: 'nowrap',
	wordBreak: 'break-all',
	outlineStyle: 'none',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	...font('p2m'),
});
