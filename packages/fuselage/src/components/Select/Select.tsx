import { useActiveDescendant, useMergedRefs, useResizeObserver, useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { AllHTMLAttributes, FocusEvent, KeyboardEvent, Key, MouseEvent, PointerEvent, RefAttributes } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useOverlayTriggerState } from 'react-stately';

import { AnimatedVisibility } from '../AnimatedVisibility';
import { Box } from '../Box';
import { Icon } from '../Icon';
import { Listbox, ListboxOption } from '../Listbox';
import { OptionContainer } from '../Options';
import { PositionAnimated } from '../PositionAnimated';
import type { SelectOption } from './SelectLegacy';
import { useTypeahead } from './useTypeahead';

export type SelectProps<V extends Key = Key> = RefAttributes<HTMLElement> & {
	/** The selectable options, as `[value, label]` tuples. */
	options: SelectOption[];
	/** The key of the selected option, which makes the select controlled. `null` selects nothing. */
	value?: V | null;
	/** The key of the option selected at first, when the select is not controlled. */
	defaultSelectedKey?: V;
	onChange?: ((key: V) => any) | undefined;
	placeholder?: string;
	error?: string;
	small?: boolean;
	disabled?: boolean;
	/** Submits the selected key under this name with the surrounding form. */
	name?: string;
} & Omit<AllHTMLAttributes<HTMLElement>, 'value' | 'onChange' | 'defaultValue' | 'name' | 'disabled' | 'placeholder'>;

const PAGE_SIZE = 10;

const isTriggerProp = (name: string) =>
	name.startsWith('aria-') || name.startsWith('data-') || ['className', 'title', 'autoFocus', 'tabIndex'].includes(name);

const pickTriggerProps = (props: Record<string, unknown>) =>
	Object.fromEntries(Object.entries(props).filter(([name]) => isTriggerProp(name)));

const isPrintableCharacter = (event: KeyboardEvent) => event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

const getLabelText = (element: HTMLButtonElement | null) =>
	Array.from(element?.labels ?? [])
		.map((label) => label.textContent?.trim())
		.filter(Boolean)
		.join(' ') || undefined;

/**
 * An input for selection of options: a button that opens a listbox of its options, named by a `label` pointing at its `id`
 * like any other input, or by `aria-label` or `aria-labelledby`.
 */
function Select<V extends Key = Key>({
	ref: outerRef,
	options,
	value,
	defaultSelectedKey,
	onChange,
	placeholder,
	error,
	small,
	disabled,
	name,
	id: idProp,
	onFocus,
	onBlur,
	onKeyDown,
	...props
}: SelectProps<V>) {
	const generatedId = useId();
	const id = idProp ?? generatedId;
	const listboxId = `${id}-listbox`;
	const getOptionId = useCallback((index: number) => `${id}-option-${index}`, [id]);

	const [uncontrolledValue, setUncontrolledValue] = useState<Key | null | undefined>(defaultSelectedKey);
	const selectedKey = value !== undefined ? value : uncontrolledValue;
	const selectedIndex = selectedKey === null || selectedKey === undefined ? -1 : options.findIndex(([key]) => key === String(selectedKey));
	const selectedOption = options[selectedIndex];

	const overlayState = useOverlayTriggerState({});
	const { active, setActive, focusVisible, setFocusVisible, moveByKeyboard, moveByPointer } = useActiveDescendant<number>();
	const { search: findByTypeahead, isSearching, reset: resetTypeahead } = useTypeahead();

	const triggerRef = useRef<HTMLButtonElement>(null);
	const { ref: resizeRef, borderBoxSize } = useResizeObserver<HTMLButtonElement>();
	const mergedRef = useMergedRefs(outerRef, triggerRef, resizeRef);

	const [listboxName, setListboxName] = useState<string>();
	const [triggerFocusVisible, setTriggerFocusVisible] = useState(false);

	const open = (index: number, byKeyboard: boolean) => {
		if (disabled || options.length === 0) {
			return;
		}

		setListboxName(getLabelText(triggerRef.current));
		overlayState.open();

		if (byKeyboard) {
			moveByKeyboard(index);
			return;
		}

		setActive(index);
		setFocusVisible(false);
	};

	const close = () => {
		overlayState.close();
		setActive(undefined);
		resetTypeahead();
	};

	const select = (index: number) => {
		const option = options[index];
		close();

		if (!option || index === selectedIndex) {
			return;
		}

		setUncontrolledValue(option[0]);
		onChange?.(option[0] as V);
	};

	const labels = options.map(([key, label]) => label ?? key);
	const lastIndex = options.length - 1;
	const activeIndex = active ?? -1;
	const initialIndex = selectedIndex >= 0 ? selectedIndex : 0;

	const handleKeyDown = useStableCallback((event: KeyboardEvent<HTMLButtonElement>) => {
		onKeyDown?.(event);

		if (event.defaultPrevented) {
			return;
		}

		if (event.key === ' ' && isSearching()) {
			event.preventDefault();
			const match = findByTypeahead(event.key, labels, overlayState.isOpen ? activeIndex : selectedIndex);

			if (match >= 0) {
				if (overlayState.isOpen) {
					moveByKeyboard(match);
				} else {
					open(match, true);
				}
			}

			return;
		}

		if (!overlayState.isOpen) {
			switch (event.key) {
				case 'ArrowDown':
				case 'ArrowUp':
				case 'Enter':
				case ' ':
					event.preventDefault();
					open(initialIndex, true);
					return;

				case 'Home':
					event.preventDefault();
					open(0, true);
					return;

				case 'End':
					event.preventDefault();
					open(lastIndex, true);
					return;
			}

			if (isPrintableCharacter(event)) {
				const match = findByTypeahead(event.key, labels, selectedIndex);

				if (match >= 0) {
					open(match, true);
				}
			}

			return;
		}

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				moveByKeyboard(Math.min(activeIndex + 1, lastIndex));
				return;

			case 'ArrowUp':
				event.preventDefault();

				if (event.altKey) {
					select(activeIndex);
					return;
				}

				moveByKeyboard(Math.max(activeIndex - 1, 0));
				return;

			case 'Home':
				event.preventDefault();
				moveByKeyboard(0);
				return;

			case 'End':
				event.preventDefault();
				moveByKeyboard(lastIndex);
				return;

			case 'PageDown':
				event.preventDefault();
				moveByKeyboard(Math.min(activeIndex + PAGE_SIZE, lastIndex));
				return;

			case 'PageUp':
				event.preventDefault();
				moveByKeyboard(Math.max(activeIndex - PAGE_SIZE, 0));
				return;

			case 'Enter':
			case ' ':
				event.preventDefault();
				select(activeIndex);
				return;

			case 'Tab':
				select(activeIndex);
				return;

			case 'Escape':
				event.preventDefault();
				event.stopPropagation();
				close();
				return;
		}

		if (isPrintableCharacter(event)) {
			const match = findByTypeahead(event.key, labels, activeIndex);

			if (match >= 0) {
				moveByKeyboard(match);
			}
		}
	});

	const handleFocus = (event: FocusEvent<HTMLButtonElement>) => {
		setTriggerFocusVisible(event.currentTarget.matches?.(':focus-visible') ?? false);
		onFocus?.(event);
	};

	const handleBlur = (event: FocusEvent<HTMLButtonElement>) => {
		setTriggerFocusVisible(false);
		close();
		onBlur?.(event);
	};

	// Safari takes the focus off a pressed button, which would close the list before the click that toggles it.
	const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
		if (overlayState.isOpen) {
			event.preventDefault();
		}
	};

	const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
		// Safari does not focus a button on click, and the keyboard and the closing on blur need the focus here.
		event.currentTarget.focus();

		if (overlayState.isOpen) {
			close();
			return;
		}

		open(initialIndex, false);
	};

	useEffect(() => {
		if (!overlayState.isOpen || active === undefined) {
			return;
		}

		triggerRef.current?.ownerDocument.getElementById(getOptionId(active))?.scrollIntoView?.({ block: 'nearest' });
	}, [overlayState.isOpen, active, getOptionId]);

	const { isOpen } = overlayState;

	return (
		<>
			{name !== undefined && (
				<input
					type='hidden'
					name={name}
					disabled={disabled}
					value={selectedKey === null || selectedKey === undefined ? '' : String(selectedKey)}
				/>
			)}
			<Box
				{...pickTriggerProps(props)}
				is='button'
				type='button'
				ref={mergedRef}
				id={id}
				role='combobox'
				aria-haspopup='listbox'
				aria-expanded={isOpen}
				aria-controls={isOpen ? listboxId : undefined}
				aria-activedescendant={isOpen && active !== undefined ? getOptionId(active) : undefined}
				aria-invalid={props['aria-invalid'] ?? (error ? true : undefined)}
				disabled={disabled}
				animated
				rcx-select
				display='flex'
				flexDirection='row'
				fontScale='p2'
				justifyContent='space-between'
				rcx-input-box--small={small}
				className={[error && 'invalid', disabled && 'disabled', (triggerFocusVisible || isOpen) && 'focus', props.className]
					.filter(Boolean)
					.join(' ')}
				onMouseDown={handleMouseDown}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				onFocus={handleFocus}
				onBlur={handleBlur}
			>
				<Box is='span' color={selectedOption ? 'titles-labels' : 'hint'} {...(small && { fontScale: 'c1' })}>
					{selectedOption ? (selectedOption[1] ?? selectedOption[0]) : placeholder}
				</Box>
				<Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size='x20' />
			</Box>
			<PositionAnimated
				visible={isOpen ? AnimatedVisibility.VISIBLE : AnimatedVisibility.HIDDEN}
				anchor={triggerRef}
				placement='bottom-start'
				margin={4}
				preventScroll={isOpen}
			>
				<Box
					aria-hidden={!isOpen || undefined}
					style={isOpen ? undefined : { pointerEvents: 'none' }}
					onPointerDown={(event: PointerEvent) => event.preventDefault()}
				>
					<OptionContainer style={{ width: borderBoxSize?.inlineSize }}>
						<Listbox
							id={listboxId}
							aria-labelledby={props['aria-labelledby']}
							aria-label={props['aria-labelledby'] ? undefined : (props['aria-label'] ?? listboxName)}
						>
							{options.map(([key, label], index) => (
								<ListboxOption
									key={key}
									id={getOptionId(index)}
									selected={index === selectedIndex}
									active={index === active}
									focusVisible={focusVisible}
									onActivate={() => moveByPointer(index)}
									onSelect={() => select(index)}
								>
									{label ?? key}
								</ListboxOption>
							))}
						</Listbox>
					</OptionContainer>
				</Box>
			</PositionAnimated>
		</>
	);
}

export default Select;
