export const convertToCss = (values: Record<string, string>, selector = ':root') =>
	`${selector} {\n${Object.entries(values)
		.map(([name, color]) => `--rcx-sidebar-color-${name}: ${color};`)
		.join('\n')}\n}`;
