import type { ComponentType, MouseEventHandler, ReactNode } from 'react';
import { useId, useLayoutEffect, useMemo, useRef } from 'react';

import { prevent } from '../../helpers/prevent';
import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { ItemDivider } from '../Item';
import { Option, OptionHeader } from '../Option';
import { PopoverSurface } from '../PopoverSurface';
import type { OptionType } from './OptionType';
import OptionsEmpty from './OptionsEmpty';
import { optionsCustomProperties, type OptionsSize } from './optionsCustomProperties';

export type OptionsProps<TValue extends string | number = string | number, TLabel = ReactNode> = Omit<
	ElementProps<HTMLElement>,
	'onSelect'
> & {
	/** A number is a height in pixels; a string is any CSS size. */
	maxHeight?: OptionsSize;
	/** A number is a width in pixels; a string is any CSS size. */
	width?: OptionsSize;
	multiple?: boolean;
	options: OptionType<TValue, TLabel>[];
	cursor: number;
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
	renderEmpty?: ComponentType<{
		customEmpty?: string;
	}>;
	onSelect: (option: OptionType<TValue, TLabel>) => void;
	customEmpty?: string;
};

/**
 * An input for selection of options.
 */
function Options<TValue extends string | number = string | number, TLabel = ReactNode>({
	maxHeight,
	width,
	style,
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
		<Box rcx-options {...props} style={optionsCustomProperties({ width }, style)}>
			<PopoverSurface>
				<Box
					ref={liRef}
					rcx-options__list
					style={optionsCustomProperties({ maxHeight })}
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
			</PopoverSurface>
		</Box>
	);
}

export default Options;
