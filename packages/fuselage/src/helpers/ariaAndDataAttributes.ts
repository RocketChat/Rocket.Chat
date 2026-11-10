type AriaAndData<TProps> = {
	[Key in keyof TProps as Key extends `aria-${string}` | `data-${string}` ? Key : never]: TProps[Key];
};

/**
 * Every `aria-*` and `data-*` attribute a consumer passes, declared in the part's props or not, to spread on the element
 * it renders: TypeScript accepts any hyphenated attribute at a call site, so a part forwarding them only by name would
 * drop the rest silently.
 */
export const ariaAndDataAttributes = <TProps extends object>(props: TProps): AriaAndData<TProps> => {
	const attributes: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (key.startsWith('aria-') || key.startsWith('data-')) {
			attributes[key] = value;
		}
	}
	return attributes as AriaAndData<TProps>;
};
