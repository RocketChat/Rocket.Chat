import { useStableCallback, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { type ElementType, useState, useRef, useMemo } from 'react';

import type { OptionType, SelectOption, SelectProps } from '..';
import { prevent } from '../../helpers/prevent';
import { AnimatedVisibility } from '../AnimatedVisibility';
import { Box } from '../Box';
import { Icon } from '../Icon';
import { Option } from '../Option';
import { useVisible } from '../Options/useVisible';
import { OptionsPaginated } from '../OptionsPaginated';
import { PositionAnimated } from '../PositionAnimated';
import SelectAddon from '../Select/SelectAddon';
import SelectFocus from '../Select/SelectFocus';

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
			className={useMemo(() => [error && 'invalid', disabled && 'disabled'], [error, disabled])}
			{...props}
		>
			<Box is='div' rcx-select__wrapper display='flex' marginInline='neg-x4' rcx-select__wrapper--hidden={!!visibleText}>
				{visibleText && (
					<Box flexGrow={1} is='span' marginInline={4} rcx-input-box__item fontScale='p2m' color={valueLabel ? 'titles-labels' : 'hint'}>
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
