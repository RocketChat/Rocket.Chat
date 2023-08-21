import type { Ref } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type PasswordInputProps = {
	name?: string;
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	small?: boolean;
	error?: boolean;
	onChange?: JSXInternal.EventHandler<TargetedEvent<HTMLInputElement, Event>>;
	onInput?: JSXInternal.EventHandler<TargetedEvent<HTMLInputElement, Event>>;
	onBlur?: JSXInternal.EventHandler<TargetedEvent<HTMLInputElement, Event>>;
	ref?: Ref<HTMLInputElement>;
	className?: string;
	style?: JSXInternal.CSSProperties;
};

export const PasswordInput = ({
	name,
	placeholder,
	disabled,
	small,
	error,
	className,
	style = {},
	onBlur,
	onChange,
	onInput,
	ref,
}: PasswordInputProps) => (
	<input
		name={name}
		type='password'
		placeholder={placeholder}
		disabled={disabled}
		className={createClassName(styles, 'password-input', { disabled, error, small }, [className])}
		style={style}
		onBlur={onBlur}
		onChange={onChange}
		onInput={onInput}
		ref={ref}
	/>
);
