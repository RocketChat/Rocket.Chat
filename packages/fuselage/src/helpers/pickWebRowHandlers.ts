import type { DOMAttributes } from 'react';

const webRowHandlerKeys = ['onPointerMove', 'onClickCapture', 'onDragStartCapture'] as const;

/**
 * The DOM handlers a row of a list takes besides the ones of any interactive part: the pointer move and the
 * capture-phase click and drag start that a listbox option, a menu item and a draggable row are handed.
 */
export type WebRowHandlers<TElement extends Element> = Pick<DOMAttributes<TElement>, (typeof webRowHandlerKeys)[number]>;

/** The `WebRowHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebRowHandlers = <TElement extends Element>(props: WebRowHandlers<TElement>): WebRowHandlers<TElement> => {
	const picked: Record<string, unknown> = {};
	for (const key of webRowHandlerKeys) {
		if (props[key] !== undefined) {
			picked[key] = props[key];
		}
	}
	return picked;
};
