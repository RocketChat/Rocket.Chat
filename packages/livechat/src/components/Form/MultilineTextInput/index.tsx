import type { Ref } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../../helpers/createClassName';
import styles from './styles.scss';

type MultilineTextInputProps = {
	rows?: number;
	name?: string;
	value?: string;
	placeholder?: string;
	disabled?: boolean;
	small?: boolean;
	error?: boolean;
	onChange?: JSXInternal.EventHandler<TargetedEvent<HTMLTextAreaElement, Event>>;
	onInput?: JSXInternal.EventHandler<TargetedEvent<HTMLTextAreaElement, Event>>;
	onBlur?: JSXInternal.EventHandler<TargetedEvent<HTMLTextAreaElement, Event>>;
	ref?: Ref<HTMLTextAreaElement>;
	className?: string;
	style?: JSXInternal.CSSProperties;
};

export const MultilineTextInput = ({
	name,
	placeholder,
	disabled,
	small,
	rows = 1,
	error,
	className,
	style = {},
	onChange,
	onInput,
	onBlur,
	ref,
	value,
}: MultilineTextInputProps) => (
	<textarea
		rows={rows}
		name={name}
		placeholder={placeholder}
		disabled={disabled}
		className={createClassName(styles, 'textarea-input', { disabled, error, small }, [className])}
		style={style}
		onChange={onChange}
		onInput={onInput}
		onBlur={onBlur}
		ref={ref}
		value={value}
	/>
);
