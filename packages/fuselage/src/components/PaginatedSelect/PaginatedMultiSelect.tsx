import { useStableCallback, useResizeObserver, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import {
	useState,
	useRef,
	type AriaAttributes,
	type ComponentType,
	type ReactNode,
	type MouseEvent,
	type CSSProperties,
	type Ref,
	type FocusEventHandler,
} from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { prevent } from '../../helpers/prevent';
import type { CommonAttributes, WebAttributes } from '../../types/ElementAttributes';
import { AnimatedVisibility } from '../AnimatedVisibility';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { Option } from '../Option';
import { useVisible } from '../Options/useVisible';
import { OptionsPaginated } from '../OptionsPaginated';
import { PositionAnimated } from '../PositionAnimated';
import SelectAddon from '../Select/SelectAddon';
import SelectContainer from '../Select/SelectContainer';
import SelectFocus from '../Select/SelectFocus';

export type PaginatedMultiSelectOption = {
	value: string | number;
	label: string;
};

export type PaginatedMultiSelectProps = CommonAttributes &
	Pick<WebAttributes<HTMLDivElement>, 'className' | 'title'> &
	Pick<AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-invalid' | 'aria-required'> & {
		ref?: Ref<HTMLDivElement>;
		/** Fires when the focus leaves a control inside the select. */
		onBlur?: FocusEventHandler<HTMLDivElement>;
		error?: boolean;
		name?: string;
		disabled?: boolean;
		filter?: string;
		options: PaginatedMultiSelectOption[];
		withTitle?: boolean;
		placeholder?: string;
		endReached?: (start?: number, end?: number) => void;
		value?: PaginatedMultiSelectOption[];
		onChange: (values: PaginatedMultiSelectOption[]) => void;
		renderOptions?: ComponentType<{
			width?: CSSProperties['width'];
			multiple?: boolean;
			filter?: string;
			role?: string;
			options: PaginatedMultiSelectOption[];
			cursor: number;
			endReached?: (start?: number, end?: number) => void;
			renderItem?: ComponentType<{
				role?: string;
				label?: ReactNode;
				title?: string;
				selected?: boolean;
				index?: number;
				focus?: boolean;
				value?: string | number;
				onMouseDown?: (e: MouseEvent<HTMLElement>) => void;
			}>;
			onSelect: (option: [unknown, string]) => void;
			onMouseDown?: (e: MouseEvent<HTMLElement>) => void;
		}>;
		renderItem?: ComponentType<{
			role?: string;
			label?: ReactNode;
			title?: string;
			selected?: boolean;
			index?: number;
			focus?: boolean;
			value?: string | number;
			onMouseDown?: (e: MouseEvent<HTMLElement>) => void;
		}>;
		anchor?: any;
	};

const PaginatedMultiSelect = ({
	'ref': outerRef,
	withTitle,
	value,
	filter,
	options = [],
	error,
	disabled,
	'anchor': Anchor = SelectFocus,
	onChange = () => {},
	placeholder,
	'renderOptions': OptionsComponent = OptionsPaginated,
	renderItem = Option,
	endReached,
	id,
	'aria-labelledby': ariaLabelledBy,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
	className,
	title,
	onBlur,
	...props
}: PaginatedMultiSelectProps) => {
	const [internalValue, setInternalValue] = useState(value || []);

	const currentValue = value !== undefined ? value : internalValue;

	const selectedOptions = options.filter((option) => currentValue.some((opt) => opt.value === option.value));

	const [visible, hide, show] = useVisible();

	const ref = useRef<HTMLInputElement>(null);
	const { ref: containerRef, borderBoxSize } = useResizeObserver();
	const containerMergedRef = useMergedRefs(outerRef, containerRef);

	const handleClick = useStableCallback(() => {
		if (visible === AnimatedVisibility.VISIBLE) {
			return hide();
		}
		if (ref && ref.current) {
			ref.current.focus();
			return show();
		}
	});

	const addOption = (value: unknown) => {
		const option = options.find((opt) => opt.value === value);
		if (!option) {
			return;
		}

		const newValue = [...currentValue, option];
		setInternalValue(newValue);
		onChange(newValue);
	};

	const removeOption = (value: unknown) => {
		const newValue = currentValue.filter((opt) => opt.value !== value);

		setInternalValue(newValue);
		onChange(newValue);
	};

	const toggleOption = (value: unknown) => {
		if (currentValue.some((opt) => opt.value === value)) {
			removeOption(value);
			return;
		}

		addOption(value);
	};

	return (
		<SelectContainer
			{...ariaAndDataAttributes(props)}
			kind='select'
			invalid={!!error}
			disabled={disabled}
			onClick={handleClick}
			onBlur={onBlur}
			className={className}
			title={title}
			ref={containerMergedRef}
		>
			<div className='rcx-box rcx-box--full rcx-select__field'>
				<div className='rcx-box rcx-box--full rcx-select__values rcx-select__values--spacious' role='listbox'>
					<Anchor
						disabled={disabled}
						ref={ref}
						aria-haspopup='listbox'
						id={id}
						aria-labelledby={ariaLabelledBy}
						aria-describedby={ariaDescribedBy}
						aria-invalid={ariaInvalid}
						onClick={show}
						onBlur={hide}
						last
					>
						{placeholder ?? null}
					</Anchor>

					{selectedOptions.map(({ value, label }, index) => (
						<Chip
							key={value ?? index}
							className='rcx-select__chip'
							title={withTitle ? label : undefined}
							tabIndex={-1}
							role='option'
							onClick={(e) => {
								prevent(e);
								removeOption(value);
							}}
						>
							{label}
						</Chip>
					))}
				</div>
			</div>
			<SelectAddon>
				<Icon name={visible === AnimatedVisibility.VISIBLE ? 'cross' : 'chevron-down'} size='x20' />
			</SelectAddon>
			<PositionAnimated visible={visible} anchor={containerRef}>
				<OptionsComponent
					width={borderBoxSize.inlineSize}
					onMouseDown={prevent}
					multiple
					filter={filter}
					role='listbox'
					options={options}
					cursor={-1}
					endReached={endReached}
					renderItem={renderItem}
					onSelect={([value]) => {
						toggleOption(value);
					}}
				/>
			</PositionAnimated>
		</SelectContainer>
	);
};

export default PaginatedMultiSelect;
