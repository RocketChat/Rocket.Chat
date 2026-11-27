import { Children, Fragment, isValidElement } from 'react';
import type { ReactNode } from 'react';

type WithChildren = { children?: ReactNode };

/** Calls back with each node that renders something, looking inside fragments. Nothing is cloned, as `Children.toArray` would. */
export const forEachSlot = (children: ReactNode, callback: (child: ReactNode) => void): void => {
	Children.forEach(children, (child) => {
		if (child === null || child === undefined || typeof child === 'boolean') {
			return;
		}
		if (isValidElement<WithChildren>(child) && child.type === Fragment) {
			forEachSlot(child.props.children, callback);
			return;
		}
		callback(child);
	});
};

/** How many lines a content holds: its children that render something. */
export const countLines = (children: ReactNode): number => {
	let lines = 0;
	forEachSlot(children, () => {
		lines++;
	});
	return lines;
};
