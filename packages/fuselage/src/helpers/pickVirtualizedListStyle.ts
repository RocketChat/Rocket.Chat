import { virtualizedListStyleKeys } from '../types/WebElementAttributes';
import type { VirtualizedListStyle } from '../types/WebElementAttributes';

/**
 * The `style` a virtualizer handed the list it renders, narrowed to the offsets it computes, to spread on the literal
 * render element. Any other key is dropped: a part takes no consumer `style`.
 */
export const pickVirtualizedListStyle = ({ style }: { style?: object }): { style?: VirtualizedListStyle } => {
	if (!style) {
		return {};
	}

	const picked: Record<string, unknown> = {};
	for (const key of virtualizedListStyleKeys) {
		const value = (style as Record<string, unknown>)[key];
		if (value !== undefined) {
			picked[key] = value;
		}
	}
	return Object.keys(picked).length > 0 ? { style: picked } : {};
};
