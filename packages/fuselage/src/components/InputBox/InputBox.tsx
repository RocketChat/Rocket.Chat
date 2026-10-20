import { useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, ReactNode, RefAttributes } from 'react';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import type { BoxProps } from '../Box';
import { Icon } from '../Icon';
import Input from './Input';
import InputBoxAddon from './InputBoxAddon';
import InputBoxWrapper from './InputBoxWrapper';

export type InputBoxProps<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement = any> = Omit<BoxProps, 'ref'> &
	RefAttributes<T> & {
		startAddon?: ReactNode;
		endAddon?: ReactNode;
		input?: ReactNode;
		multiple?: boolean;
		error?: string;
		placeholder?: string;
		placeholderVisible?: boolean;
		small?: boolean;
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
 * A decorated input control with support for addons.
 *
 * Usually you'll perfer to use `-Input` (e.g. <LinkTo kind='Forms/TextInput' story='Default'>`TextInput`</LinkTo>)
 * components over this one because it works as a construction block for them.
 */
// eslint-disable-next-line complexity
function InputBox<T extends HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>({
	ref,
	className,
	startAddon,
	endAddon,
	error,
	hidden,
	invisible,
	multiple,
	placeholderVisible,
	type = 'text',
	small,
	onChange,
	...props
}: InputBoxProps<T>) {
	const innerRef = useRef<T>(null);
	const mergedRef = useMergedRefs(ref, innerRef);
	const [invalid, setInvalid] = useState(false);
	let defaultAddon = endAddon;

	useLayoutEffect(() => {
		if (innerRef.current && innerRef.current.setCustomValidity) {
			innerRef.current.setCustomValidity(error || '');
		}
	}, [error]);

	useLayoutEffect(() => {
		if (defaultAddon && innerRef.current) {
			setInvalid(!innerRef.current.checkValidity());
		}
	}, [defaultAddon, error]);

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLElement>) => {
			if (defaultAddon && innerRef.current) {
				setInvalid(!innerRef.current.checkValidity());
			}

			onChange?.call(event.currentTarget, event);
		},
		[defaultAddon, onChange],
	);

	const handleAddonClick = () => (innerRef.current as HTMLInputElement).showPicker();

	if (type === 'date') {
		defaultAddon = <Icon name='calendar' size='x20' onClick={handleAddonClick} />;
	}
	if (type === 'time') {
		defaultAddon = <Icon name='clock' size='x20' onClick={handleAddonClick} />;
	}

	if (!defaultAddon && !startAddon) {
		return (
			<Input
				is={(type === 'textarea' && 'textarea') || (type === 'select' && 'select') || 'input'}
				className={className}
				cols={(type === 'textarea' && 1) || (type === 'select' && 0) || 0}
				hidden={hidden}
				invisible={invisible}
				multiple={multiple}
				ref={mergedRef}
				htmlSize={(type === 'textarea' && undefined) || (type === 'select' && 1) || 1}
				type={type === 'textarea' || type === 'select' ? undefined : type}
				onChange={handleChange}
				rcx-input-box--multiple={multiple}
				rcx-input-box--placeholder-visible={placeholderVisible}
				rcx-input-box--type={type}
				rcx-input-box--small={small}
				{...props}
			/>
		);
	}

	return (
		<InputBoxWrapper
			className={[props.disabled && 'disabled', invalid && 'invalid', ...(Array.isArray(className) ? className : [className])]}
			hidden={hidden}
			invisible={invisible}
			small={small}
		>
			{startAddon && <InputBoxAddon>{startAddon}</InputBoxAddon>}
			<Input
				is={(type === 'textarea' && 'textarea') || (type === 'select' && 'select') || 'input'}
				className={className}
				cols={(type === 'textarea' && 1) || (type === 'select' && 0) || 0}
				multiple={multiple}
				ref={mergedRef}
				htmlSize={(type === 'textarea' && undefined) || (type === 'select' && 1) || 1}
				type={type === 'textarea' || type === 'select' ? undefined : type}
				onChange={handleChange}
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
