import type { CSSProperties } from 'react';

import { pickPositionStyle } from './pickAttributes';
import type { PositionStyle } from '../types/ElementAttributes';

type CustomProperties = { [name: `--rcx-${string}`]: string | number | undefined };

/**
 * The inline `style` that carries a part's own open values (a width, a duration) as `--rcx-*` custom properties, to spread
 * on the literal render element. A frame reads each one through `var(--rcx-x, fallback)`.
 */
export const customProperties = (properties: CustomProperties): { style: CSSProperties } => {
	const style: Record<string, string> = {};
	for (const [name, value] of Object.entries(properties)) {
		if (value !== undefined) style[name] = String(value);
	}
	return { style };
};

/**
 * The inline `style` of a part that `Position` places and that also carries open values: what `Position` handed it, narrowed
 * to `PositionStyle`, and its `--rcx-*` custom properties. To spread on the literal render element.
 */
export const positionedCustomProperties = (
	{ style }: { style?: object },
	properties: CustomProperties,
): { style: CSSProperties & PositionStyle } => ({
	style: { ...pickPositionStyle({ style }).style, ...customProperties(properties).style },
});
