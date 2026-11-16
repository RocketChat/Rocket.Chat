import type { CSSProperties } from 'react';

/**
 * The space at the ends of the list belongs to its first and last rows, so the virtualizer measures it with them: the
 * bottom is the end of the last row, space included, and a page added at the start moves it with the first row.
 */
export const edgeSpacing = (index: number, length: number, startSpacing: number, endSpacing: number): CSSProperties | undefined => {
	const start = index === 0 && startSpacing > 0 ? startSpacing : undefined;
	const end = index === length - 1 && endSpacing > 0 ? endSpacing : undefined;
	return start === undefined && end === undefined ? undefined : { paddingBlockStart: start, paddingBlockEnd: end };
};
