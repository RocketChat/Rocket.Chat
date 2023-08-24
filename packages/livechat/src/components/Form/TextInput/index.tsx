import type { Ref } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type TextInputProps = {
	name?: string;
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	small?: boolean;
	error?: boolean;
	onChange?: JSXInternal.EventHandler<TargetedEvent<HTMLInputElement, Event>>;
	onInput?: JSXInternal.EventHandler<TargetedEvent<HTMLInputElement, Event>>;
	onBlur?: JSXInternal.EventHandler<TargetedEvent<HTMLInputElement, Event>>;
	className?: string;
	style?: JSXInternal.CSSProperties;
	ref?: Ref<HTMLInputElement>;
};

const TextInput = ({ name, value, placeholder, disabled, small, error, onChange, onInput, className, style = {}, ref }: TextInputProps) => (
	<input
		type='text'
		name={name}
		value={value}
		placeholder={placeholder}
		disabled={disabled}
		onChange={onChange}
		onInput={onInput}
		className={createClassName(styles, 'text-input', { disabled, error, small }, [className])}
		ref={ref}
		style={style}
	/>
);

export { TextInput };
