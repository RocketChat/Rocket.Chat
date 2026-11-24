type AriaAndData<TProps> = {
	[Key in keyof TProps as Key extends `aria-${string}` | `data-${string}` ? Key : never]: TProps[Key];
} & { 'data-testid'?: string };

/** The `aria-*` and `data-*` attributes a consumer passed, and the contract's `testID` as `data-testid`, to spread on the render element. */
export const ariaAndDataAttributes = <TProps extends object>(props: TProps & { testID?: string }): AriaAndData<TProps> => {
	const attributes: Record<string, unknown> = {};
	if (props.testID !== undefined) {
		attributes['data-testid'] = props.testID;
	}
	for (const key of Object.keys(props)) {
		if (key.startsWith('aria-') || key.startsWith('data-')) {
			attributes[key] = (props as Record<string, unknown>)[key];
		}
	}
	return attributes as AriaAndData<TProps>;
};
