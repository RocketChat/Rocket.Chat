type BridgeableProps = {
	is?: unknown;
	type?: string | undefined;
	rows?: number | undefined;
	readOnly?: boolean | undefined;
	disabled?: boolean | undefined;
	autoCorrect?: 'on' | 'off' | boolean | undefined;
	onChange?: ((value: string) => void) | undefined;
};

type NativeInputProps = {
	onChangeText?: (text: string) => void;
	secureTextEntry?: boolean;
	keyboardType?: 'email-address' | 'numeric' | 'url' | 'phone-pad';
	returnKeyType?: 'search';
	autoCapitalize?: 'none';
	autoCorrect?: boolean;
	editable?: false;
	multiline?: true;
	numberOfLines?: number;
};

const typeDefaults: Partial<Record<string, NativeInputProps>> = {
	email: { keyboardType: 'email-address', autoCapitalize: 'none' },
	number: { keyboardType: 'numeric' },
	url: { keyboardType: 'url', autoCapitalize: 'none' },
	search: { returnKeyType: 'search' },
	tel: { keyboardType: 'phone-pad' },
};

/** The props an input hands to a React Native `TextInput`: the web-style props mapped to their native ones. A `type='password'` always becomes `secureTextEntry`, with autocorrect and autocapitalize off. */
export const bridgeInputProps = <P extends BridgeableProps>({
	onChange,
	type,
	rows,
	readOnly,
	disabled,
	autoCorrect,
	...props
}: P): Omit<P, 'onChange' | 'type' | 'rows' | 'readOnly' | 'disabled' | 'autoCorrect'> & NativeInputProps => ({
	...(type ? typeDefaults[type] : undefined),
	...props,
	...(onChange && { onChangeText: (text: string) => onChange(text) }),
	...(autoCorrect !== undefined && { autoCorrect: autoCorrect === true || autoCorrect === 'on' }),
	...((readOnly || disabled) && { editable: false as const }),
	...(props.is === 'textarea' && { multiline: true as const, numberOfLines: rows }),
	...(type === 'password' && { secureTextEntry: true, autoCorrect: false, autoCapitalize: 'none' as const }),
});
