import type { Ref } from 'preact';
import { memo, type TargetedEvent } from 'preact/compat';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type DateInputProps = {
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

const DateInput = ({
	name,
	value,
	placeholder,
	disabled,
	small,
	error,
	onChange,
	onInput,
	onBlur,
	className,
	style = {},
	ref,
}: DateInputProps) => (
	<input
		type='date'
		name={name}
		value={value}
		placeholder={placeholder}
		disabled={disabled}
		onChange={onChange}
		onInput={onInput}
		onBlur={onBlur}
		className={createClassName(styles, 'date-input', { disabled, error, small }, [className])}
		style={style}
		ref={ref}
	/>
);

export default memo(DateInput);
