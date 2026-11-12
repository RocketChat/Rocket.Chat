import { useStableCallback, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { type ElementType, useState, useRef } from 'react';

import { prevent } from '../../helpers/prevent.js';
import { AnimatedVisibility } from '../AnimatedVisibility/index.js';
import { Box } from '../Box/index.js';
import { Icon } from '../Icon/index.js';
import { Option } from '../Option/index.js';
import { useVisible } from '../Options/useVisible.js';
import { OptionsPaginated } from '../OptionsPaginated/index.js';
import { PositionAnimated } from '../PositionAnimated/index.js';
import SelectAddon from '../Select/SelectAddon.js';
import SelectFocus from '../Select/SelectFocus.js';
import type { OptionType, SelectOption, SelectProps } from '../index.js';

export type PaginatedOptionType = {
	value: string | number;
	label: string;
};

export type PaginatedSelectProps = Omit<SelectProps, 'options'> & {
	anchor?: ElementType;
	options: PaginatedOptionType[];
	withTitle?: boolean;
	endReached?: (index: number) => void;
	setFilter?: (value: string | undefined | number) => void;
};

export const PaginatedSelect = ({
	value,
	withTitle,
	filter,
	'setFilter': _setFilter,
	error,
	disabled,
	options = [],
	'anchor': Anchor = SelectFocus,
	onChange = () => {},
	placeholder,
	'renderOptions': _Options = OptionsPaginated,
	renderItem = Option,
	endReached,
	id,
	'aria-labelledby': ariaLabelledBy,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
	...props
}: PaginatedSelectProps) => {
	const [internalValue, setInternalValue] = useState(value);

	const currentValue = value !== undefined ? value : internalValue;

	const option = options.find((option) => option?.value === currentValue);

	const [visible, hide, show] = useVisible();

	const internalChangedByClick = useStableCallback(([value]: OptionType) => {
		setInternalValue(value);
		onChange(value as SelectOption[0]); // FIXME
		hide();
	});

	const ref = useRef<HTMLInputElement>(null);

	const { ref: containerRef, borderBoxSize } = useResizeObserver();

	const valueLabel = option?.label;

	const isUnfilteredOrHidden = filter === undefined || visible === AnimatedVisibility.HIDDEN;

	const visibleText = isUnfilteredOrHidden ? valueLabel || placeholder : undefined;

	const handleClick = useStableCallback(() => {
		if (visible === AnimatedVisibility.VISIBLE) {
			return hide();
		}
		if (ref && ref.current) {
			ref.current.focus();
			return show();
		}
	});

	return (
		<Box
			animated
			rcx-select
			disabled={disabled}
			ref={containerRef}
			onClick={handleClick}
			rcx-select--invalid={!!error}
			rcx-select--disabled={disabled}
			{...props}
		>
			<Box is='div' rcx-select__wrapper display='flex' marginInline='neg-x4' rcx-select__wrapper--hidden={!!visibleText}>
				{visibleText && (
					<Box flexGrow={1} is='span' marginInline={4} rcx-select__item fontScale='p2m' color={valueLabel ? 'titles-labels' : 'hint'}>
						{visibleText}
					</Box>
				)}
				<Anchor
					disabled={disabled}
					rcx-input-box--undecorated
					filter={filter}
					ref={ref}
					aria-haspopup='listbox'
					id={id}
					aria-labelledby={ariaLabelledBy}
					aria-describedby={ariaDescribedBy}
					aria-invalid={ariaInvalid}
					onClick={show}
					onBlur={hide}
				/>
				<SelectAddon>
					<Icon name={visible === AnimatedVisibility.VISIBLE ? 'chevron-up' : 'chevron-down'} size='x20' />
				</SelectAddon>
			</Box>
			<PositionAnimated visible={visible} anchor={containerRef}>
				<_Options
					withTitle={withTitle}
					width={borderBoxSize.inlineSize}
					role='listbox'
					filter={filter}
					options={options}
					onSelect={internalChangedByClick}
					endReached={endReached}
					onMouseDown={prevent}
					renderItem={renderItem}
				/>
			</PositionAnimated>
		</Box>
	);
};
