import type { TargetedEvent } from 'preact/compat';
import { useState } from 'preact/hooks';
import type { JSXInternal } from 'preact/src/jsx';
import type { ControllerRenderProps } from 'react-hook-form';

import ArrowIcon from '../../../icons/arrowDown.svg';
import { createClassName } from '../../helpers';
import styles from './styles.scss';

type SelectInputProps = {
	name?: string;
	placeholder?: string;
	options: { value: string; label: string }[];
	disabled?: boolean;
	small?: boolean;
	error?: boolean;
	onChange?: JSXInternal.EventHandler<TargetedEvent<HTMLSelectElement, Event>>;
	onInput?: JSXInternal.EventHandler<TargetedEvent<HTMLSelectElement, Event>>;
	className?: string;
	style?: JSXInternal.CSSProperties;
	field?: ControllerRenderProps<{ [key: string]: string }, any>;
	value?: string;
};

export const SelectInput = ({
	name,
	placeholder,
	options = [],
	disabled,
	small,
	error,
	onInput,
	className,
	style = {},
	field,
	onChange = () => undefined,
	value,
	...props
}: SelectInputProps) => {
	const [internalValue, setInternalValue] = useState(value);

	const SelectOptions = Array.from(options).map(({ value, label }, key) => (
		<option key={key} value={value} className={createClassName(styles, 'select-input__option')}>
			{label}
		</option>
	));

	const handleChange = (event: TargetedEvent<HTMLSelectElement, Event>) => {
		onChange(event);

		if (event.defaultPrevented) {
			return;
		}

		setInternalValue((event.target as HTMLSelectElement)?.value);
	};

	return field ? (
		<div className={createClassName(styles, 'select-input', {}, [className])} style={style}>
			<select
				name={name}
				value={internalValue}
				disabled={disabled}
				onChange={handleChange}
				onInput={onInput}
				className={createClassName(styles, 'select-input__select', {
					disabled,
					error,
					small,
					placeholder: !internalValue,
				})}
				{...props}
			>
				<option value='' disabled hidden>
					{placeholder}
				</option>
				{SelectOptions}
			</select>
			<ArrowIcon className={createClassName(styles, 'select-input__arrow')} />
		</div>
	) : (
		<div className={createClassName(styles, 'select-input', {}, [className])} style={style}>
			<select
				name={name}
				disabled={disabled}
				className={createClassName(styles, 'select-input__select', {
					disabled,
					error,
					small,
					placeholder: !internalValue,
				})}
				// TODO: find a better way to handle the difference between react and preact on TS
				{...(field as any)}
				{...props}
			>
				<option value='' disabled hidden>
					{placeholder}
				</option>
				{SelectOptions}
			</select>
			<ArrowIcon className={createClassName(styles, 'select-input__arrow')} />
		</div>
	);
};
