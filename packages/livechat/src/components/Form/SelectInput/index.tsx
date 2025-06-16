import type { ComponentChild, Ref } from 'preact';
import type { TargetedEvent } from 'preact/compat';
import type { JSXInternal } from 'preact/src/jsx';

import { createClassName } from '../../../helpers/createClassName';
import ArrowIcon from '../../../icons/arrowDown.svg';
import styles from './styles.scss';

type SelectInputProps = {
	name?: string;
	placeholder?: ComponentChild;
	options: { value: string; label: ComponentChild }[];
	disabled?: boolean;
	small?: boolean;
	error?: boolean;
	onChange?: JSXInternal.EventHandler<TargetedEvent<HTMLSelectElement, Event>>;
	onInput?: JSXInternal.EventHandler<TargetedEvent<HTMLSelectElement, Event>>;
	onBlur?: JSXInternal.EventHandler<TargetedEvent<HTMLSelectElement, Event>>;
	ref?: Ref<HTMLSelectElement>;
	className?: string;
	style?: JSXInternal.CSSProperties;
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
	onBlur,
	onChange = () => undefined,
	className,
	style = {},
	value,
	ref,
}: SelectInputProps) => {
	const SelectOptions = Array.from(options).map(({ value, label }, key) => (
		<option key={key} value={value} className={createClassName(styles, 'select-input__option')}>
			{label}
		</option>
	));

	return (
		<div className={createClassName(styles, 'select-input', {}, [className])} style={style}>
			<select
				name={name}
				value={value}
				disabled={disabled}
				onChange={onChange}
				onBlur={onBlur}
				onInput={onInput}
				className={createClassName(styles, 'select-input__select', {
					disabled,
					error,
					small,
					placeholder: !value,
				})}
				ref={ref}
			>
				{placeholder && (
					<option selected value='' disabled hidden>
						{placeholder}
					</option>
				)}
				{SelectOptions}
			</select>
			<ArrowIcon className={createClassName(styles, 'select-input__arrow')} />
		</div>
	);
};
