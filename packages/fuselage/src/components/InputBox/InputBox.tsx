import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { AllHTMLAttributes, ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Icon } from '../Icon';
import Input from './Input';
import InputBoxAddon from './InputBoxAddon';
import InputBoxWrapper from './InputBoxWrapper';

export type InputBoxProps<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement = any> = Omit<
	ElementProps<T, AllHTMLAttributes<T>>,
	'type'
> & {
	/** Lands on the wrapper when there is an addon, and on the input otherwise. */
	className?: string;
	/** Hides the input but keeps the space it takes in the layout. */
	invisible?: boolean;
	/** Content inside the input's border, before the value, such as an icon. */
	startAddon?: ReactNode;
	/**
	 * Content inside the input's border, after the value, such as an icon or a small button. With `type='date'` or
	 * `type='time'`, a picker icon takes its place.
	 */
	endAddon?: ReactNode;
	/** Reduces the end padding so a button in `endAddon` sits flush with the input's edge. */
	endAddonFlush?: boolean;
	input?: ReactNode;
	/** Accepts several values, for the types that support it: `email`, `file` and `select`. */
	multiple?: boolean;
	/**
	 * Marks the input as invalid, with this text as its native validation message. The input doesn't display it: show it
	 * in a `FieldError`.
	 */
	error?: string;
	placeholder?: string;
	/** Shows the value in the placeholder's color. */
	placeholderVisible?: boolean;
	/** Shrinks the input to 28 pixels high, with smaller text. */
	small?: boolean;
	/** The kind of value the input takes: an HTML input type, or `textarea` or `select` for those elements. */
	type:
		| 'button'
		| 'checkbox'
		| 'color'
		| 'date'
		| 'datetime'
		| 'datetime-local'
		| 'email'
		| 'file'
		| 'hidden'
		| 'image'
		| 'month'
		| 'number'
		| 'password'
		| 'radio'
		| 'range'
		| 'reset'
		| 'search'
		| 'submit'
		| 'tel'
		| 'text'
		| 'time'
		| 'url'
		| 'week'
		| 'textarea'
		| 'select';
};

/**
 * The bordered box the text inputs are built on, with room for addons around the value. Reach for the input made for
 * the value (`TextInput`, `EmailInput`, `NumberInput`…) first, and for `InputBox` when none fits, such as for a date.
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
	multiple,
	placeholderVisible,
	type = 'text',
	small,
	...props
}: InputBoxProps<T>) {
	const innerRef = useRef<T>(null);
	const mergedRef = useMergedRefs(ref, innerRef);
	let defaultAddon = endAddon;

	useLayoutEffect(() => {
		if (innerRef.current?.setCustomValidity) {
			innerRef.current.setCustomValidity(error || '');
		}
	}, [error]);

	const handleAddonClick = () => (innerRef.current as HTMLInputElement).showPicker();

	if (type === 'date') {
		defaultAddon = <Icon name='calendar' size='x20' onClick={handleAddonClick} />;
	}
	if (type === 'time') {
		defaultAddon = <Icon name='clock' size='x20' onClick={handleAddonClick} />;
	}

	const is = (type === 'textarea' && 'textarea') || (type === 'select' && 'select') || 'input';
	const cols = (type === 'textarea' && 1) || (type === 'select' && 0) || 0;
	const htmlSize = (type === 'textarea' && undefined) || (type === 'select' && 1) || 1;
	const inputType = type === 'textarea' || type === 'select' ? undefined : type;

	if (!defaultAddon && !startAddon) {
		return (
			<Input
				is={is}
				className={className}
				cols={cols}
				hidden={hidden}
				invisible={invisible}
				multiple={multiple}
				ref={mergedRef}
				htmlSize={htmlSize}
				type={inputType}
				rcx-input-box--multiple={multiple}
				rcx-input-box--placeholder-visible={placeholderVisible}
				rcx-input-box--type={type}
				rcx-input-box--small={small}
				{...props}
			/>
		);
	}

	return (
		<InputBoxWrapper className={className} hidden={hidden} invisible={invisible} rcx-input-box__wrapper--end-addon-flush={endAddonFlush}>
			{startAddon && <InputBoxAddon>{startAddon}</InputBoxAddon>}
			<Input
				is={is}
				cols={cols}
				multiple={multiple}
				ref={mergedRef}
				htmlSize={htmlSize}
				type={inputType}
				rcx-input-box--multiple={multiple}
				rcx-input-box--placeholder-visible={placeholderVisible}
				rcx-input-box--type={type}
				rcx-input-box--undecorated
				rcx-input-box--small={small}
				{...props}
			/>
			{defaultAddon && <InputBoxAddon>{defaultAddon}</InputBoxAddon>}
		</InputBoxWrapper>
	);
}

export default InputBox;
