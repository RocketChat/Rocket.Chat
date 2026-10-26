import { useStableCallback, useResizeObserver, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import type {
	AllHTMLAttributes,
	ChangeEvent,
	ComponentType,
	FocusEvent,
	MouseEvent,
	MouseEventHandler,
	ReactNode,
	RefAttributes,
} from 'react';
import { useEffect, useRef, useMemo, useState } from 'react';

import { AnimatedVisibility } from '../AnimatedVisibility';
import { Box } from '../Box';
import { Chip } from '../Chip';
import { Icon } from '../Icon';
import { Input } from '../InputBox';
import { useCursor, Options, type OptionType } from '../Options';
import { PositionAnimated } from '../PositionAnimated';

export type AutoCompleteOption<TLabel> = {
	value: string;
	label: TLabel;
};

const getSelected = <TLabel,>(value: string | string[] | undefined, options: AutoCompleteOption<TLabel>[]) => {
	if (!value) {
		return [];
	}
	return typeof value === 'string'
		? options.filter((option) => option.value === value)
		: options?.filter((option) => value.includes(option.value));
};

const isSelectedValid =
	<TLabel,>(value: string | string[] | undefined) =>
	(selected: AutoCompleteOption<TLabel>) => {
		if (!value) {
			return false;
		}

		return typeof value === 'string' ? selected.value === value : value.includes(selected.value);
	};

/**
 * @deprecated Use `SelectFilteredProps` or `MultiSelectFilteredProps` instead.
 */
export type AutoCompleteProps<TLabel = ReactNode> = Omit<AllHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'is'> & {
	filter: string;
	setFilter?: (filter: string) => void;
	options?: AutoCompleteOption<TLabel>[];
	renderSelected?: ComponentType<{
		selected: AutoCompleteOption<TLabel>;
		onRemove?: (event: MouseEvent<HTMLButtonElement>) => void;
	}>;
	onChange: (value: string | string[]) => void;
	renderItem?: ComponentType<{
		role?: string;
		label: TLabel;
		value: string;
		selected?: boolean;
		focus?: boolean;
		onMouseDown: MouseEventHandler;
	}>;
	renderEmpty?: ComponentType<{
		customEmpty?: string;
	}>;
	placeholder?: string;
	error?: boolean;
	disabled?: boolean;
	multiple?: boolean;
	value?: string | string[];
} & RefAttributes<HTMLInputElement>;

/**
 * An input for selection of options.
 *
 * @deprecated Use `SelectFiltered` or `MultiSelectFiltered` instead.
 */
function AutoComplete<TLabel = ReactNode>({
	ref,
	value,
	filter,
	setFilter,
	options = [],
	renderItem,
	renderSelected: RenderSelected,
	onChange,
	renderEmpty,
	placeholder,
	error,
	disabled,
	multiple,
	onBlur: onBlurAction = () => {},
	...props
}: AutoCompleteProps<TLabel>) {
	const innerRef = useRef<HTMLInputElement>(null);
	const mergedRefs = useMergedRefs(ref, innerRef);
	const { ref: containerRef, borderBoxSize } = useResizeObserver();

	const [selected, setSelected] = useState(() => getSelected(value, options) || []);

	useEffect(() => {
		setSelected((currentSelected) => {
			const incoming = getSelected(value, options) || [];
			const incomingMap = new Map(incoming.map((item) => [item.value, item]));

			const mappedCurrent = currentSelected
				.map((item) => incomingMap.get(item.value) || item)
				.filter(isSelectedValid(value));

			const currentValues = new Set(mappedCurrent.map((item) => item.value));
			const newIncoming = incoming.filter((item) => !currentValues.has(item.value));

			const validMerged = [...mappedCurrent, ...newIncoming];

			const isDifferent =
				validMerged.length !== currentSelected.length ||
				validMerged.some(
					(item, index) =>
						item.value !== currentSelected[index]?.value ||
						item.label !== currentSelected[index]?.label
				);

			if (isDifferent) {
				return validMerged;
			}
			return currentSelected;
		});
	}, [value, options]);

	const handleSelect = useStableCallback(([newValue]: OptionType<string, TLabel>) => {
		if (selected.some((item) => item.value === newValue)) {
			hide();
			return;
		}

		if (multiple) {
			setSelected([...selected, ...getSelected(newValue, options)]);
			onChange([...(value || []), newValue]);
		} else {
			setSelected(getSelected(newValue, options));
			onChange(newValue);
		}

		setFilter?.('');
		hide();
	});

	const handleRemove = useStableCallback((event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		event.preventDefault();

		const filtered = selected.filter((item) => item.value !== event.currentTarget.value);

		const filteredValue = multiple && Array.isArray(value) ? value?.filter((item) => item !== event.currentTarget.value) || [] : '';

		setSelected(filtered);
		onChange(filteredValue);
		hide();
	});

	const memoizedOptions = useMemo(() => options.map(({ value, label }): OptionType<string, TLabel> => [value, label]), [options]);

	const firstSelectedIndex = useMemo(() => options.findIndex((option) => selected[0]?.value === option.value), [options, selected]);

	const [cursor, handleKeyDown, , reset, [optionsAreVisible, hide, show]] = useCursor(firstSelectedIndex, memoizedOptions, handleSelect);

	const handleOnBlur = useStableCallback((event: FocusEvent<HTMLInputElement>) => {
		hide();
		onBlurAction(event);
	});

	useEffect(reset, [filter, reset]);

	return (
		<Box
			animated
			rcx-autocomplete
			ref={containerRef}
			onClick={useStableCallback(() => innerRef.current?.focus())}
			flexGrow={1}
			className={useMemo(() => [error && 'invalid', disabled && 'disabled'], [error, disabled])}
		>
			<Box display='flex' flexGrow={1} alignItems='center' flexWrap='wrap' gap={4} role='group'>
				<Input
					ref={mergedRefs}
					onChange={useStableCallback((e: ChangeEvent<HTMLInputElement>) => setFilter?.(e.currentTarget.value))}
					onBlur={handleOnBlur}
					onFocus={show}
					onKeyDown={handleKeyDown}
					placeholder={optionsAreVisible === AnimatedVisibility.HIDDEN || !value ? placeholder : undefined}
					value={filter}
					disabled={disabled}
					{...props}
					className={['rcx-input-box--undecorated', 'rcx-autocomplete__input', props.className].filter(Boolean).join(' ')}
				/>
				{selected.map((itemSelected) =>
					RenderSelected ? (
						<RenderSelected key={itemSelected.value} selected={itemSelected} onRemove={handleRemove} />
					) : (
						<Chip key={itemSelected.value} value={itemSelected.value} onClick={handleRemove}>
							{itemSelected.label as ReactNode}
						</Chip>
					),
				)}
			</Box>
			<Box
				rcx-autocomplete__addon
				color='titles-labels'
				role='button'
				tabIndex={disabled ? -1 : 0}
				aria-label={optionsAreVisible === AnimatedVisibility.VISIBLE ? 'Clear filter' : 'Open options'}
				onKeyDown={useStableCallback((e: React.KeyboardEvent<HTMLElement>) => {
					if (disabled) return;
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						e.stopPropagation();
						if (optionsAreVisible === AnimatedVisibility.VISIBLE) {
							hide();
							setFilter?.('');
						} else {
							innerRef.current?.focus();
							show();
						}
					}
				})}
				onMouseDown={useStableCallback((e: MouseEvent<HTMLElement>) => {
					if (disabled) return;
					e.preventDefault();
					e.stopPropagation();

					if (optionsAreVisible === AnimatedVisibility.VISIBLE) {
						hide();
						setFilter?.('');
					} else {
						innerRef.current?.focus();
						show();
					}
				})}
				onClick={useStableCallback((e: MouseEvent<HTMLElement>) => {
					e.stopPropagation();
				})}
				style={{ cursor: disabled ? 'not-allowed' : optionsAreVisible === AnimatedVisibility.VISIBLE ? 'pointer' : 'default' }}
			>
				<Icon name={optionsAreVisible === AnimatedVisibility.VISIBLE ? 'cross' : 'magnifier'} size='x20' />
			</Box>
			<PositionAnimated visible={optionsAreVisible} anchor={containerRef}>
				<Options
					style={{ width: borderBoxSize.inlineSize }}
					onSelect={handleSelect}
					renderItem={renderItem}
					renderEmpty={renderEmpty}
					cursor={cursor}
					options={memoizedOptions}
				/>
			</PositionAnimated>
		</Box>
	);
}

export default AutoComplete;
