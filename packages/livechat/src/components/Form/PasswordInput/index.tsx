import type { TargetedEvent } from 'preact/compat';
import type { JSXInternal } from 'preact/src/jsx';
import type { ControllerRenderProps } from 'react-hook-form';

import { createClassName } from '../../helpers';
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
	className?: string;
	style?: JSXInternal.CSSProperties;
	field?: ControllerRenderProps<{ [key: string]: string }, any>;
};

export const PasswordInput = ({
	name,
	value,
	placeholder,
	disabled,
	small,
	error,
	onChange,
	onInput,
	className,
	style = {},
	field,
}: PasswordInputProps) =>
	field ? (
		<input
			type='password'
			placeholder={placeholder}
			disabled={disabled}
			className={createClassName(styles, 'password-input', { disabled, error, small }, [className])}
			style={style}
			// TODO: find a better way to handle the difference between react and preact on TS
			{...(field as any)}
		/>
	) : (
		<input
			type='password'
			name={name}
			value={value}
			placeholder={placeholder}
			disabled={disabled}
			onChange={onChange}
			onInput={onInput}
			className={createClassName(styles, 'password-input', { disabled, error, small }, [className])}
			style={style}
		/>
	);
