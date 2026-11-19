import { useMergedRefs, useStableCallback, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { ElementType, MouseEventHandler, ReactNode, RefAttributes } from 'react';
import { useState, useRef, useEffect } from 'react';

import { prevent } from '../../helpers/prevent';
import type { ElementProps } from '../../types/ElementProps';
import { AnimatedVisibility } from '../AnimatedVisibility';
import { Box } from '../Box';
import type { IconProps } from '../Icon';
import { Icon } from '../Icon';
import { CheckOption } from '../Option';
import { Options, useCursor } from '../Options';
import { PositionAnimated } from '../PositionAnimated';
import type { SelectOption } from '../Select';
import MultiSelectAnchor from './MultiSelectAnchor';
import type { MultiSelectAnchorParams } from './MultiSelectAnchorParams';
import { SelectedOptions } from './SelectedOptions';
import SelectAddon from '../Select/SelectAddon';

export type MultiSelectProps = Omit<ElementProps<HTMLDivElement>, 'ref' | 'onChange'> &
	RefAttributes<HTMLInputElement> & {
		name?: string;
		disabled?: boolean;
		placeholder?: string;
		/** Hides the options whose label doesn't contain this text, ignoring case. */
		filter?: string;
		value?: SelectOption[0][];
		/**
		 * Shows the select as invalid; set `aria-invalid` too, for assistive technology. The message isn't shown: show it
		 * in a `FieldError`.
		 */
		error?: string;
		/** The options, as `[value, label]` tuples. Which ones are selected comes from `value`, not from a third item. */
		options: SelectOption[];
		onChange: (params: SelectOption[0][]) => void;
		/** Gives the label a selected option shows in its chip. */
		getLabel?: (params: SelectOption) => SelectOption[1];
		getValue?: (params: SelectOption) => SelectOption[0];
		/** What the list says when it has no option to show, in place of "Empty". */
		customEmpty?: string;
		/** Replaces the element that takes the focus and the keys, such as with a text input that filters the options. */
		anchor?: ElementType<MultiSelectAnchorParams>;
		/** Replaces the list of options. */
		renderOptions?: ElementType;
		/** Renders each option in the list, in place of an option with a checkbox. */
		renderItem?: ElementType;
		/** Renders each selected option, in place of a chip; the `onClick` it gets deselects the option. */
		renderSelected?: ElementType<{
			value: SelectOption[0];
			label: SelectOption[1];
			onMouseDown: MouseEventHandler;
			onClick: MouseEventHandler;
			children: ReactNode;
		}>;
		/** Replaces the chevron shown while the list is closed. */
		addonIcon?: IconProps['name'];
		/** Called with an empty string once an option is picked, to clear `filter`. */
		setFilter?: (filter: string) => void;
	};

/**
 * Picks several options from a list. Each one picked shows as a chip, which deselects it when clicked.
 */
function MultiSelect({
	ref,
	value,
	filter,
	setFilter,
	options = [],
	error,
	disabled,
	anchor: Anchor = MultiSelectAnchor,
	onChange = () => undefined,
	getLabel = ([, label] = ['', '']) => label,
	getValue = ([value]) => value,
	placeholder,
	renderOptions: _Options = Options,
	renderItem,
	customEmpty,
	renderSelected: RenderSelected,
	addonIcon,
	...props
}: MultiSelectProps) {
	const [internalValue, setInternalValue] = useState<SelectOption[0][]>(value || []);
	const [syncedValue, setSyncedValue] = useState(value);
	if (value !== syncedValue) {
		setSyncedValue(value);
		setInternalValue(value || []);
	}

	const [currentOptionValue, setCurrentOption] = useState<SelectOption[0]>();

	const index = options.findIndex((option) => getValue(option) === currentOptionValue);

	const internalChanged = ([value]: SelectOption) => {
		if (internalValue.includes(value)) {
			setCurrentOption(undefined);
			const newValue = internalValue.filter((item) => item !== value);
			setInternalValue(newValue);
			return onChange(newValue);
		}
		setFilter?.('');
		setCurrentOption(value);
		const newValue = [...internalValue, value];
		setInternalValue(newValue);
		return onChange(newValue);
	};

	const mapOptions = ([value, label]: SelectOption): SelectOption => {
		if (internalValue.includes(value)) {
			return [value, label, true];
		}
		return [value, label];
	};

	const applyFilter = ([, option]: SelectOption) => !filter || option.toLowerCase().includes(filter.toLowerCase());

	const filteredOptions: SelectOption[] = options.filter(applyFilter).map(mapOptions);

	const [cursor, handleKeyDown, handleKeyUp, reset, [visible, hide, show]] = useCursor(index, filteredOptions, internalChanged);

	useEffect(reset, [filter, reset]);

	const innerRef = useRef<HTMLElement>(null);
	const anchorRef = useMergedRefs(ref, innerRef);

	const { ref: containerRef, borderBoxSize } = useResizeObserver();

	const handleClick = useStableCallback(() => {
		if (visible === AnimatedVisibility.VISIBLE) {
			return hide();
		}
		innerRef.current?.focus();
		return show();
	});

	const listboxId = props.id ? `${props.id}-listbox` : undefined;

	const {
		id,
		name,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		'aria-describedby': ariaDescribedBy,
		'aria-invalid': ariaInvalid,
		'aria-required': ariaRequired,
		autoFocus,
		...containerProps
	} = props;

	return (
		<Box
			is='div'
			animated
			rcx-select
			rcx-select--invalid={!!error}
			rcx-select--disabled={disabled}
			ref={containerRef}
			onClick={handleClick}
			disabled={disabled}
			{...containerProps}
		>
			<Box is='div' rcx-select__field>
				<Box is='div' rcx-select__values>
					<Anchor
						ref={anchorRef}
						disabled={disabled ?? false}
						onClick={show}
						onBlur={hide}
						onKeyDown={handleKeyDown}
						onKeyUp={handleKeyUp}
						role='combobox'
						aria-expanded={visible === AnimatedVisibility.VISIBLE}
						aria-haspopup='listbox'
						aria-controls={listboxId}
						id={id}
						name={name}
						aria-label={ariaLabel}
						aria-labelledby={ariaLabelledBy}
						aria-describedby={ariaDescribedBy}
						aria-invalid={ariaInvalid}
						aria-required={ariaRequired}
						autoFocus={autoFocus}
					>
						{internalValue.length === 0 ? placeholder : null}
					</Anchor>
					{internalValue.map((value: SelectOption[0]) => {
						const currentOption = options.find(([val]) => val === value) as SelectOption;
						return RenderSelected ? (
							<RenderSelected
								value={value}
								key={value}
								label={getLabel(currentOption)}
								onMouseDown={prevent}
								onClick={(e) => {
									prevent(e);
									internalChanged(currentOption);
								}}
							>
								{getLabel(currentOption)}
							</RenderSelected>
						) : (
							<SelectedOptions
								tabIndex={-1}
								key={String(value)}
								onMouseDown={prevent}
								onClick={(e) => {
									prevent(e);
									internalChanged(currentOption);
								}}
							>
								{getLabel(currentOption)}
							</SelectedOptions>
						);
					})}
				</Box>
			</Box>
			<SelectAddon>
				<Icon name={visible === AnimatedVisibility.VISIBLE ? 'chevron-up' : addonIcon || 'chevron-down'} size='x20' />
			</SelectAddon>
			<PositionAnimated visible={visible} anchor={containerRef}>
				<_Options
					width={borderBoxSize.inlineSize}
					onMouseDown={prevent}
					multiple
					filter={filter}
					renderItem={renderItem || CheckOption}
					id={listboxId}
					options={filteredOptions}
					onSelect={internalChanged}
					cursor={cursor}
					customEmpty={customEmpty}
				/>
			</PositionAnimated>
		</Box>
	);
}

export default MultiSelect;
