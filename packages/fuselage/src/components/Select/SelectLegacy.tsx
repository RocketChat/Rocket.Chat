import { useMergedRefs, useStableCallback, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { ElementType, MouseEvent, RefAttributes } from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { AnimatedVisibility } from '../AnimatedVisibility';
import { Box } from '../Box';
import { Icon, type IconProps } from '../Icon';
import type { OptionType } from '../Options';
import { Options, useCursor } from '../Options';
import { PositionAnimated } from '../PositionAnimated';
import SelectAddon from './SelectAddon';
import SelectFocus from './SelectFocus';

export type SelectOption = readonly [value: string, label: string, selected?: boolean];

export type SelectProps = Omit<ElementProps<HTMLDivElement>, 'ref' | 'onChange'> &
	RefAttributes<HTMLInputElement> & {
		value?: string | number;
		name?: string;
		disabled?: boolean;
		placeholder?: string;
		/** Replaces the element that takes the focus and the keys, such as with a text input that filters the options. */
		anchor?: ElementType;
		/**
		 * Shows the select as invalid; set `aria-invalid` too, for assistive technology. The message isn't shown: show it
		 * in a `FieldError`.
		 */
		error?: string;
		options: SelectOption[];
		onChange: (value: SelectOption[0]) => void;
		getLabel?: (params: SelectOption) => SelectOption[1];
		getValue?: (params: SelectOption) => SelectOption[0];
		/** Hides the options whose label doesn't contain this text, ignoring case. */
		filter?: string;
		/** Replaces the list of options. */
		renderOptions?: ElementType;
		/** Renders each option in the list. */
		renderItem?: ElementType;
		/** Renders the selected option in the select, in place of its label. */
		renderSelected?: ElementType;
		/** What the list says when it has no option to show, in place of "Empty". */
		customEmpty?: string;
		/** Replaces the chevron shown while the list is closed. */
		addonIcon?: IconProps['name'];
	};

/**
 * The earlier `Select`, whose parts can be replaced through `anchor` and the render props. `SelectFiltered` builds on
 * it.
 */
function SelectLegacy({
	ref,
	value,
	filter,
	error,
	disabled,
	options = [],
	'anchor': Anchor = SelectFocus,
	onChange = () => undefined,
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
	const [syncedValue, setSyncedValue] = useState(value);
	if (value !== syncedValue) {
		setSyncedValue(value);
		setInternalValue(value || '');
	}

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

	const internalChangedByClick = useStableCallback(([value]: OptionType) => {
		setInternalValue(value);
		onChange(value as SelectOption[0]); // FIXME
		hide();
	});

	const { ref: containerRef, borderBoxSize } = useResizeObserver();

	const didMount = useRef(false);
	useEffect(() => {
		if (didMount.current) {
			reset();
		}
		didMount.current = true;
	}, [filter, internalValue, reset]);

	const valueLabel = getLabel(option);

	const visibleText =
		(filter === undefined || visible === AnimatedVisibility.HIDDEN) && (valueLabel || placeholder || typeof placeholder === 'string');

	const handleClick = useStableCallback((event: MouseEvent) => {
		// A keyboard click (Space keyup) arrives after the keydown already opened the list.
		if (event.detail === 0) {
			return;
		}

		if (visible === AnimatedVisibility.VISIBLE) {
			return hide();
		}

		innerRef.current?.focus();
		return show();
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
			<Box is='div' rcx-select__wrapper rcx-select__wrapper--hidden={!!visibleText}>
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
						<Box is='span' rcx-select__item rcx-select__item--placeholder={!valueLabel}>
							{visibleText}
						</Box>
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
			</Box>
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
		</Box>
	);
}

export default SelectLegacy;
