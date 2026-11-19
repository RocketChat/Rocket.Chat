import type { ComponentType, MouseEventHandler, ReactNode } from 'react';
import { useId, useLayoutEffect, useMemo, useRef } from 'react';

import { prevent } from '../../helpers/prevent';
import type { ElementProps } from '../../types/ElementProps';
import { Box, type BoxProps } from '../Box';
import { ItemDivider } from '../Item';
import { Option, OptionHeader } from '../Option';
import { PopoverSurface } from '../PopoverSurface';
import { Scrollable } from '../Scrollable';
import type { OptionType } from './OptionType';
import OptionsEmpty from './OptionsEmpty';

export type OptionsProps<TValue extends string | number = string | number, TLabel = ReactNode> = Omit<
	ElementProps<HTMLElement>,
	'onSelect'
> & {
	/** Height past which the list scrolls. */
	maxHeight?: BoxProps['maxHeight'];
	/** Tells assistive technology that more than one option can be selected. */
	multiple?: boolean;
	/** The entries as `[value, label, selected?, disabled?, type?, url?]`; a `type` of `heading` or `divider` structures the list. */
	options: OptionType<TValue, TLabel>[];
	/** Index of the option the arrow keys reached, highlighted and scrolled into view. `useCursor` keeps it. */
	cursor: number;
	/** Renders each option, such as `CheckOption` for a multiple selection. */
	renderItem?: ComponentType<{
		id?: string;
		role?: string;
		label: TLabel;
		value: TValue;
		selected?: boolean;
		focus?: boolean;
		disabled?: boolean;
		onMouseDown: MouseEventHandler;
	}>;
	/** Shown in place of the list when there are no `options`. */
	renderEmpty?: ComponentType<{
		customEmpty?: string;
	}>;
	/** Called with the entry of the option that was picked, unless it is disabled. */
	onSelect: (option: OptionType<TValue, TLabel>) => void;
	/** Text of the empty state, in place of "Empty". */
	customEmpty?: string;
};

/**
 * The floating list a select or an autocomplete opens, where the user picks one or more options with the pointer or the
 * keyboard.
 */
function Options<TValue extends string | number = string | number, TLabel = ReactNode>({
	maxHeight,
	multiple,
	renderEmpty: EmptyComponent = OptionsEmpty,
	options,
	cursor,
	renderItem: OptionComponent = Option,
	onSelect,
	customEmpty,
	id,
	...props
}: OptionsProps<TValue, TLabel>) {
	const liRef = useRef<HTMLElement>(null);
	const optionIdPrefix = useId();

	useLayoutEffect(() => {
		if (!liRef.current) {
			return;
		}
		const { current } = liRef;
		const li = current.querySelector<HTMLElement>(`[id="${optionIdPrefix}-${cursor}"]`);
		if (!li) {
			return;
		}
		if (li.offsetTop + li.clientHeight > current.scrollTop + current.clientHeight || li.offsetTop - li.clientHeight < current.scrollTop) {
			current.scrollTop = li.offsetTop;
		}
	}, [cursor, optionIdPrefix]);

	const activeType = options[cursor]?.[4];
	const activeDescendant =
		options[cursor] && activeType !== 'heading' && activeType !== 'divider' ? `${optionIdPrefix}-${cursor}` : undefined;

	const optionsMemoized = useMemo(
		() =>
			options.map(([value, label, selected, disabled, type, url], i) => {
				switch (type) {
					case 'heading':
						return <OptionHeader key={value}>{label}</OptionHeader>;
					case 'divider':
						return <ItemDivider key={value} is='li' aria-hidden />;
					default:
						return (
							<OptionComponent
								id={`${optionIdPrefix}-${i}`}
								role='option'
								label={label}
								onMouseDown={(e) => {
									if (disabled) return;

									prevent(e);
									onSelect([value, label, selected, disabled, type, url]);
								}}
								key={value}
								value={value}
								selected={!!selected}
								disabled={disabled}
								focus={cursor === i}
							/>
						);
				}
			}),
		[options, cursor, onSelect, OptionComponent, optionIdPrefix],
	);

	return (
		<Box rcx-options {...props}>
			<PopoverSurface>
				<Scrollable vertical smooth>
					<Box
						ref={liRef}
						rcx-options__list
						maxHeight={maxHeight}
						onMouseDown={prevent}
						onClick={prevent}
						is='ol'
						aria-multiselectable={!!multiple}
						role='listbox'
						id={id}
						aria-activedescendant={activeDescendant}
					>
						{!options.length && <EmptyComponent customEmpty={customEmpty} />}
						{optionsMemoized}
					</Box>
				</Scrollable>
			</PopoverSurface>
		</Box>
	);
}

export default Options;
