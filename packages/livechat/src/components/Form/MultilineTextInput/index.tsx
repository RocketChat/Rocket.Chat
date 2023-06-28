import type { TargetedEvent } from 'preact/compat';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../helpers';
import styles from './styles.scss';

type MultilineTextInputProps = {
	name: string;
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	small?: boolean;
	rows?: number;
	error?: boolean;
	onChange?: JSXInternal.EventHandler<TargetedEvent<HTMLTextAreaElement, Event>>;
	onInput?: JSXInternal.EventHandler<TargetedEvent<HTMLTextAreaElement, Event>>;
	className?: string;
	style?: JSXInternal.CSSProperties;
};

export const MultilineTextInput = ({
	name,
	value,
	placeholder,
	disabled,
	small,
	rows = 1,
	error,
	onChange,
	onInput,
	className,
	style = {},
	...props
}: MultilineTextInputProps) => (
	<textarea
		rows={rows}
		name={name}
		value={value}
		placeholder={placeholder}
		disabled={disabled}
		onChange={onChange}
		onInput={onInput}
		className={createClassName(styles, 'text-input', { disabled, error, small }, [className])}
		style={style}
		{...props}
	/>
);
