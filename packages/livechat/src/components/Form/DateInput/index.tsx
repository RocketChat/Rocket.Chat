import { JSXInternal } from 'preact/src/jsx';
import { createClassName, memo } from '../../helpers';
import styles from './styles.scss';
import { TargetedEvent } from 'preact/compat';
import { ControllerRenderProps } from 'react-hook-form';

type DateInputProps = {
	name: string;
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	small?: boolean;
	error?: boolean;
	onChange?: JSXInternal.EventHandler<TargetedEvent<HTMLInputElement, Event>>;
	onInput?: JSXInternal.EventHandler<TargetedEvent<HTMLInputElement, Event>>;
	className?: string;
	style?: JSXInternal.CSSProperties;
	field?: ControllerRenderProps;
};

const DateInput = ({ name, value, placeholder, disabled, small, error, onChange, onInput, className, style = {}, field }: DateInputProps) => (
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
		{...field}
	/>
);

export default memo(DateInput);
