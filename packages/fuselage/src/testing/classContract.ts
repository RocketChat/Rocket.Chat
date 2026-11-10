const pathOf = (element: Element, root: Element) => {
	const segments = ['root'];
	for (let node: Element | null = element; node && node !== root; node = node.parentElement) {
		const current: Element = node;
		const same = [...(current.parentElement?.children ?? [])].filter((child) => child.tagName === current.tagName);
		const tag = current.tagName.toLowerCase();
		segments.splice(1, 0, same.length > 1 ? `${tag}[${same.indexOf(current)}]` : tag);
	}
	return segments.join(' > ');
};

/**
 * The `rcx-*` classes of every element under `root`, one line per element, as `path: classes`. Generated `rcx-css-*` classes
 * are left out: their hash changes with the declarations. Compare it to a literal in the spec.
 */
export const classContract = (root: Element) =>
	[root, ...root.querySelectorAll('*')]
		.map((element) => {
			const classes = [...element.classList].filter((name) => name.startsWith('rcx-') && !name.startsWith('rcx-css-'));
			return classes.length ? `${pathOf(element, root)}: ${classes.sort().join(' ')}` : null;
		})
		.filter(Boolean)
		.join('\n');
