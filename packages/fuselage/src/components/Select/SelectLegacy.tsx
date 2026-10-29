import { useMergedRefs, useStableCallback, useResizeObserver, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import type { DependencyList, ElementType, RefAttributes } from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { AnimatedVisibility } from '../AnimatedVisibility';
import { Icon, type IconProps } from '../Icon';
import type { OptionType } from '../Options';
import { Options, useCursor } from '../Options';
import { PositionAnimated } from '../PositionAnimated';
import SelectAddon from './SelectAddon';
import SelectContainer from './SelectContainer';
import SelectFocus from './SelectFocus';
import SelectItem from './SelectItem';
import SelectWrapper from './SelectWrapper';

export type SelectOption = readonly [value: string, label: string, selected?: boolean];

const useDidUpdate = (func: () => void, deps: DependencyList | undefined) => {
	const didMount = useRef(false);
	const fn = useStableCallback(func);

	useEffect(() => {
		if (didMount.current) {
			fn();
		}
		didMount.current = true;
	}, deps || []);
};

export type SelectProps = Omit<ElementProps<HTMLDivElement>, 'ref' | 'onChange'> &
	RefAttributes<HTMLInputElement> & {
		value?: string | number;
		name?: string;
		disabled?: boolean;
		placeholder?: string;
		anchor?: ElementType;
		error?: string;
		options: SelectOption[];
		onChange: (value: SelectOption[0]) => void;
		getLabel?: (params: SelectOption) => SelectOption[1];
		getValue?: (params: SelectOption) => SelectOption[0];
		filter?: string;
		renderOptions?: ElementType;
		renderItem?: ElementType;
		renderSelected?: ElementType;
		customEmpty?: string;
		addonIcon?: IconProps['name'];
	};

function SelectLegacy({
	ref,
	value,
	filter,
	error,
	disabled,
	options = [],
	'anchor': Anchor = SelectFocus,
	onChange = () => {},
	getValue = ([value] = ['', '']) => value,
	getLabel = ([, label] = ['', '']) => label,
	placeholder = '',
	renderItem,
	'renderSelected': RenderSelected,
	'renderOptions': _Options = Options,
	addonIcon,
	customEmpty,
	id,
	'aria-labelledby': ariaLabelledBy,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
	...props
}: SelectProps) {
	const [internalValue, setInternalValue] = useState(value || '');

	const internalChangedByKeyboard = useStableCallback(([value]: OptionType) => {
		setInternalValue(value);
		onChange(value as SelectOption[0]); // FIXME
	});

	const option = options.find((option) => getValue(option) === internalValue) as SelectOption;

	const index = options.indexOf(option);

	const filteredOptions = useMemo<OptionType[]>((): OptionType[] => {
		const mapOptions = ([value, label]: SelectOption): OptionType => {
			if (internalValue === value) {
				return [value, label, true];
			}
			return [value, label];
		};

		const applyFilter = ([, option]: SelectOption) => !filter || ~option.toLowerCase().indexOf(filter.toLowerCase());

		return options.filter(applyFilter).map(mapOptions);
	}, [options, internalValue, filter]);

	const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(index, filteredOptions, internalChangedByKeyboard);

	const innerRef = useRef<HTMLInputElement | null>(null);
	const anchorRef = useMergedRefs(ref, innerRef);

	const removeFocusClass = () => innerRef.current?.classList.remove('focus-visible');

	const internalChangedByClick = useStableCallback(([value]: OptionType) => {
		setInternalValue(value);
		onChange(value as SelectOption[0]); // FIXME
		removeFocusClass();
		hide();
	});

	const { ref: containerRef, borderBoxSize } = useResizeObserver();

	useDidUpdate(reset, [filter, internalValue]);
	useOutsideClick([containerRef], removeFocusClass);

	const valueLabel = getLabel(option);

	const visibleText =
		(filter === undefined || visible === AnimatedVisibility.HIDDEN) && (valueLabel || placeholder || typeof placeholder === 'string');

	const handleClick = useStableCallback(() => {
		if (innerRef.current?.classList.contains('focus-visible')) {
			removeFocusClass();
			return hide();
		}

		innerRef.current?.classList.add('focus-visible');
		innerRef.current?.focus();
		return show();
	});

	return (
		<SelectContainer
			animated
			rcx-select
			disabled={disabled}
			ref={containerRef}
			onClick={handleClick}
			className={useMemo(() => [error && 'invalid', disabled && 'disabled'], [error, disabled])}
			{...props}
		>
			<SelectWrapper display='flex' rcx-select__wrapper--hidden={!!visibleText}>
				{visibleText &&
					(RenderSelected ? (
						<RenderSelected
							role='option'
							value={getValue(option)}
							label={valueLabel}
							key={getValue(option)}
							onClick={internalChangedByClick}
						/>
					) : (
						<SelectItem flexGrow={1} marginInline={4} fontScale='p2' color={valueLabel ? 'titles-labels' : 'hint'}>
							{visibleText}
						</SelectItem>
					))}
				<Anchor
					ref={anchorRef}
					id={id}
					aria-labelledby={ariaLabelledBy}
					aria-describedby={ariaDescribedBy}
					aria-invalid={ariaInvalid}
					disabled={disabled ?? false}
					onClick={show}
					onBlur={hide}
					onKeyDown={handleKeyDown}
					onKeyUp={handleKeyUp}
				>
					{!value ? option || placeholder : null}
				</Anchor>
				<SelectAddon>
					<Icon name={visible === AnimatedVisibility.VISIBLE ? 'chevron-up' : addonIcon || 'chevron-down'} size='x20' />
				</SelectAddon>
			</SelectWrapper>
			<PositionAnimated visible={visible} anchor={containerRef}>
				<_Options
					width={borderBoxSize.inlineSize}
					role='listbox'
					filter={filter}
					options={filteredOptions}
					onSelect={internalChangedByClick}
					renderItem={renderItem}
					cursor={cursor}
					customEmpty={customEmpty}
				/>
			</PositionAnimated>
		</SelectContainer>
	);
}

export default SelectLegacy;
