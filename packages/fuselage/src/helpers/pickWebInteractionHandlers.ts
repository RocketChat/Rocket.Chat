import type { DOMAttributes } from 'react';

const webInteractionHandlerKeys = [
	'onContextMenu',
	'onDragStart',
	'onKeyDown',
	'onKeyUp',
	'onMouseDown',
	'onMouseEnter',
	'onMouseLeave',
	'onMouseUp',
	'onPointerDown',
	'onPointerEnter',
	'onPointerLeave',
	'onPointerUp',
	'onTouchCancel',
	'onTouchEnd',
	'onTouchMove',
	'onTouchStart',
	'onFocus',
	'onBlur',
] as const;

const webInteractionHandlers: ReadonlySet<string> = new Set(webInteractionHandlerKeys);

/**
 * The DOM handlers, besides the press, that react-aria's press, focus, hover, keyboard and long-press hooks hand to an
 * interactive element, so a part that forwards them still works as a trigger.
 */
export type WebInteractionHandlers<TElement extends Element> = Pick<DOMAttributes<TElement>, (typeof webInteractionHandlerKeys)[number]>;

/** The `WebInteractionHandlers` a consumer passed, to spread on the literal render element. */
export const pickWebInteractionHandlers = <TElement extends Element>(
	props: WebInteractionHandlers<TElement>,
): WebInteractionHandlers<TElement> => {
	const picked: Record<string, unknown> = {};
	// A part renders with a couple of props: walking them costs less than probing every handler name
	for (const key of Object.keys(props)) {
		const value = (props as Record<string, unknown>)[key];
		if (value !== undefined && webInteractionHandlers.has(key)) {
			picked[key] = value;
		}
	}
	return picked;
};
