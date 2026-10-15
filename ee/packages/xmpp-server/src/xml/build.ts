import Element from 'ltx/lib/Element';

type Child = Element | string | undefined | null;

/** Builds an ltx Element tree, skipping nullish children (convenient for conditional parts). */
export function xml(name: string, attrs: Record<string, string | undefined> = {}, ...children: Child[]): Element {
	const definedAttrs: Record<string, string> = {};
	for (const [key, value] of Object.entries(attrs)) {
		if (value !== undefined) {
			definedAttrs[key] = value;
		}
	}

	const el = new Element(name, definedAttrs);
	for (const child of children) {
		if (child === undefined || child === null) {
			continue;
		}
		if (typeof child === 'string') {
			el.t(child);
		} else {
			el.cnode(child);
		}
	}

	return el;
}

export { Element };
