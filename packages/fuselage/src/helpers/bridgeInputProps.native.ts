/** Fires the neutral `onChange(value)` from the text input's `onChangeText`, and drops the event-based `onChange`. */
export const bridgeInputProps = <P extends { onChange?: ((value: string) => void) | undefined }>({
	onChange,
	...props
}: P): Omit<P, 'onChange'> & { onChangeText?: (text: string) => void } => {
	if (!onChange) {
		return props;
	}

	return { ...props, onChangeText: (text: string) => onChange(text) };
};
