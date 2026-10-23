import { useMergedRefs, useStableCallback, useResizeObserver, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import type { ElementType, MouseEventHandler, ReactNode, RefAttributes } from 'react';
import { useState, useRef, useEffect } from 'react';

import { prevent } from '../../helpers/prevent';
import { AnimatedVisibility } from '../AnimatedVisibility';
import { Box, type BoxProps } from '../Box';
import { FlexContainer, FlexItem } from '../Flex';
import type { IconProps } from '../Icon';
import { Icon } from '../Icon';
import { Margins } from '../Margins';
import { CheckOption } from '../Option';
import { Options, useCursor } from '../Options';
import { PositionAnimated } from '../PositionAnimated';
import type { SelectOption } from '../Select';
import MultiSelectAnchor from './MultiSelectAnchor';
import type { MultiSelectAnchorParams } from './MultiSelectAnchorParams';
import { SelectedOptions } from './SelectedOptions';
import SelectAddon from '../Select/SelectAddon';

export type MultiSelectProps = Omit<BoxProps, 'ref' | 'onChange' | 'value'> &
	RefAttributes<HTMLInputElement> & {
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
	anchor: AnchorComponent = MultiSelectAnchor,
	onChange = () => undefined,
	getLabel = ([, label] = ['', '']) => label,
	getValue = ([value]) => value,
	placeholder,
	renderOptions: OptionsComponent = Options,
	renderItem,
	customEmpty,
	renderSelected: SelectedComponent,
	addonIcon,
	...props
}: MultiSelectProps) {
	const [internalValue, setInternalValue] = useState<SelectOption[0][]>(value || []);

	useEffect((): void => setInternalValue(value || []), [value]);

	const [currentOptionValue, setCurrentOption] = useState<SelectOption[0]>();

	const index = options.findIndex((option) => getValue(option) === currentOptionValue);

	const removeFocusClass = () => innerRef.current?.classList.remove('focus-visible');

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
	useOutsideClick([containerRef], removeFocusClass);

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
		...containerProps
	} = props;

	return (
		<Box
			is='div'
			animated
			rcx-select
			className={[error && 'invalid', disabled && 'disabled']}
			ref={containerRef}
			onClick={handleClick}
			disabled={disabled}
			{...containerProps}
		>
			<FlexItem grow={1}>
				<Margins inline='x4'>
					<FlexContainer>
						<Box is='div'>
							<Box is='div' display='flex' alignItems='center' flexWrap='wrap' margin='-x4' gap={4}>
								<AnchorComponent
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
								</AnchorComponent>
								{internalValue.map((value: SelectOption[0]) => {
									const currentOption = options.find(([val]) => val === value) as SelectOption;
									return SelectedComponent ? (
										<SelectedComponent
											value={value}
											key={value}
											label={getLabel(currentOption)}
											onMouseDown={(e) => {
												prevent(e);
												internalChanged(currentOption);
												removeFocusClass();
											}}
										>
											{getLabel(currentOption)}
										</SelectedComponent>
									) : (
										<SelectedOptions
											tabIndex={-1}
											key={String(value)}
											onMouseDown={(e) => {
												prevent(e);
												internalChanged(currentOption);
												removeFocusClass();
											}}
										>
											{getLabel(currentOption)}
										</SelectedOptions>
									);
								})}
							</Box>
						</Box>
					</FlexContainer>
				</Margins>
			</FlexItem>
			<FlexItem grow={0} shrink={0}>
				<SelectAddon>
					<Icon name={visible === AnimatedVisibility.VISIBLE ? 'chevron-up' : addonIcon || 'chevron-down'} size='x20' />
				</SelectAddon>
			</FlexItem>
			<PositionAnimated visible={visible} anchor={containerRef}>
				<OptionsComponent
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
