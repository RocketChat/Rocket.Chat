import type { FocusEvent } from 'react';
import { useState } from 'react';

import type { InputBoxProps } from './InputBox';
import InputBoxAddon from './InputBoxAddon';
import { inputBoxChrome, inputBoxFocusRing, inputBoxText, inputBoxUndecorated, inputBoxWrapperLayout } from './inputBoxStyleProps';
import { bridgeInputProps } from '../../helpers/bridgeInputProps';
import { Box } from '../Box';

/**
 * The native twin of `InputBox`: the border, background, padding and focus ring the web gets from its stylesheet are
 * drawn here from the same tokens, and the focus and invalid states come from `onFocus`, `onBlur` and `error`.
 */
function InputBox<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>({
	ref,
	className,
	startAddon,
	endAddon,
	endAddonFlush,
	error,
	hidden,
	invisible,
	type = 'text',
	small,
	style,
	onFocus,
	onBlur,
	...props
}: InputBoxProps<T>) {
	const [focused, setFocused] = useState(false);

	const state = { focused, invalid: !!error, disabled: !!props.disabled, small };
	const textarea = type === 'textarea';
	const wrapped = !!(startAddon || endAddon);

	const is = (textarea && 'textarea') || (type === 'select' && 'select') || 'input';
	const inputType = textarea || type === 'select' ? undefined : type;
	const display = hidden ? 'none' : undefined;

	const handleFocus = (event: FocusEvent<T>) => {
		setFocused(true);
		onFocus?.(event);
	};
	const handleBlur = (event: FocusEvent<T>) => {
		setFocused(false);
		onBlur?.(event);
	};

	const { placeholderTextColor, ...text } = inputBoxText(state);
	const nativeProps = {
		placeholderTextColor,
		style: { ...style, ...(!wrapped && inputBoxFocusRing(state)), ...(textarea && { textAlignVertical: 'top' }) },
	};

	const input = (
		<Box
			animated
			rcx-input-box
			ref={ref}
			{...text}
			{...(wrapped ? inputBoxUndecorated : { ...inputBoxChrome(state), display, invisible, className })}
			{...bridgeInputProps({ is, type: inputType, ...props })}
			onFocus={handleFocus}
			onBlur={handleBlur}
			{...nativeProps}
		/>
	);

	if (!wrapped) {
		return input;
	}

	return (
		<Box
			animated
			rcx-input-box__wrapper
			className={className}
			display={display}
			invisible={invisible}
			{...inputBoxChrome(state)}
			{...inputBoxWrapperLayout({ small, textarea, endAddonFlush })}
			style={inputBoxFocusRing(state)}
		>
			{startAddon && <InputBoxAddon>{startAddon}</InputBoxAddon>}
			{input}
			{endAddon && <InputBoxAddon>{endAddon}</InputBoxAddon>}
		</Box>
	);
}

export default InputBox;
