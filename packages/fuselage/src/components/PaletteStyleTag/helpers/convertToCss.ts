export const convertToCss = (values: Record<string, string>, prefix: string, selector = ':root') =>
	`${selector} {\n${Object.entries(values)
		.map(([name, color]) => `${prefix}-${name}: ${color};`)
		.join('\n')}\n}`;
