import { Children, Fragment } from 'react';
import type { ReactNode } from 'react';

/**
 * Puts each run of text in a span, for a part that is a `View`: a text node cannot be its child. The span lays out as the text did.
 */
export const wrapText = (children: ReactNode) => {
	const parts: ReactNode[] = [];
	let run: ReactNode[] = [];
	const flush = () => {
		if (run.length) parts.push(<span key={`text-${parts.length}`}>{run}</span>);
		run = [];
	};
	for (const child of Children.toArray(children)) {
		if (typeof child === 'string' || typeof child === 'number') {
			run.push(child);
		} else {
			flush();
			parts.push(<Fragment key={`node-${parts.length}`}>{child}</Fragment>);
		}
	}
	flush();
	return parts;
};
