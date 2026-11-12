type AriaAndData<TProps> = {
	[Key in keyof TProps as Key extends `aria-${string}` | `data-${string}` ? Key : never]: TProps[Key];
};

const noAttributes = Object.freeze({});

/**
 * Every `aria-*` and `data-*` attribute a consumer passes, declared in the part's props or not, to spread on the element
 * it renders: TypeScript accepts any hyphenated attribute at a call site, so a part forwarding them only by name would
 * drop the rest silently.
 */
export const ariaAndDataAttributes = <TProps extends object>(props: TProps): AriaAndData<TProps> => {
	let attributes: Record<string, unknown> | undefined;
	for (const key in props) {
		// Runs for every prop of every part, so the hyphen check rejects most keys before `startsWith`
		if (key.charCodeAt(4) === 45 && (key.startsWith('aria-') || key.startsWith('data-'))) {
			(attributes ??= {})[key] = props[key];
		}
	}
	return (attributes ?? noAttributes) as AriaAndData<TProps>;
};
