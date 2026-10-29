import { useMergedRefs, useStableCallback, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import type { AriaAttributes, ElementType, FocusEventHandler, MouseEventHandler, ReactNode, RefAttributes } from 'react';
import { useState, useRef, useEffect } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { prevent } from '../../helpers/prevent';
import type { CommonAttributes, WebAttributes } from '../../types/ElementAttributes';
import { AnimatedVisibility } from '../AnimatedVisibility';
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
import SelectContainer from '../Select/SelectContainer';

export type MultiSelectProps = CommonAttributes &
	Pick<WebAttributes<HTMLDivElement>, 'className' | 'title'> &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'aria-required'> &
	RefAttributes<HTMLInputElement> & {
		/** Fires when the focus leaves a control inside the select. */
		onBlur?: FocusEventHandler<HTMLDivElement>;
		name?: string;
		disabled?: boolean;
		placeholder?: string;
		filter?: string;
		value?: SelectOption[0][];
		error?: string;
		options: SelectOption[];
		onChange: (params: SelectOption[0][]) => void;
		getLabel?: (params: SelectOption) => SelectOption[1];
		getValue?: (params: SelectOption) => SelectOption[0];
		customEmpty?: string;
		anchor?: ElementType<MultiSelectAnchorParams>;
		renderOptions?: ElementType;
		renderItem?: ElementType;
		renderSelected?: ElementType<{
			value: SelectOption[0];
			label: SelectOption[1];
			onMouseDown: MouseEventHandler;
			onClick: MouseEventHandler;
			children: ReactNode;
		}>;
		addonIcon?: IconProps['name'];
		setFilter?: (filter: string) => void;
	};

/**
 * An input for selection of options.
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
	onChange = () => {},
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

	useEffect(reset, [filter]);

	const innerRef = useRef<HTMLElement>(null);
	const anchorRef = useMergedRefs(ref, innerRef);

	const { ref: containerRef, borderBoxSize } = useResizeObserver<HTMLDivElement>();

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
		className,
		title,
		onBlur,
		...containerProps
	} = props;

	return (
		<SelectContainer
			{...ariaAndDataAttributes(containerProps)}
			kind='select'
			invalid={!!error}
			disabled={disabled}
			ref={containerRef}
			onClick={handleClick}
			onBlur={onBlur}
			className={className}
			title={title}
		>
			<div className='rcx-box rcx-box--full rcx-select__field'>
				<div className='rcx-box rcx-box--full rcx-select__values'>
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
				</div>
			</div>
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
		</SelectContainer>
	);
}

export default MultiSelect;
