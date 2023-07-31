import type { TargetedEvent } from 'preact/compat';
import { memo } from 'preact/compat';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type DateInputProps = {
	name: string;
	value: string;
	placeholder: string;
	disabled: boolean;
	small: boolean;
	error: boolean;
	onChange: JSXInternal.EventHandler<TargetedEvent<HTMLInputElement, Event>>;
	onInput: JSXInternal.EventHandler<TargetedEvent<HTMLInputElement, Event>>;
	className: string;
	style: JSXInternal.CSSProperties;
};

const DateInput = ({ name, value, placeholder, disabled, small, error, onChange, onInput, className, style = {} }: DateInputProps) => (
	<input
		type='date'
		name={name}
		value={value}
		placeholder={placeholder}
		disabled={disabled}
		onChange={onChange}
		onInput={onInput}
		className={createClassName(styles, 'date-input', { disabled, error, small }, [className])}
		style={style}
	/>
);

export default memo(DateInput);
