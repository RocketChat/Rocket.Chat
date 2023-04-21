export const sidebarConvertToCss = (values: Record<string, string>, selector = ':root', prefix = 'sidebar-color') =>
	`${selector} {\n${Object.entries(values)
		.map(([name, color]) => `--rcx-${prefix}-${name}: ${color};`)
		.join('\n')}\n}`;
