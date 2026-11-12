import type { CSSProperties } from 'react';

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
