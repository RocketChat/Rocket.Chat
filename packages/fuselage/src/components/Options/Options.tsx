import type { ComponentType, MouseEventHandler, ReactNode, RefAttributes } from 'react';
import { useLayoutEffect, useMemo, useRef } from 'react';

import { prevent } from '../../helpers/prevent';
import { Box, type BoxProps } from '../Box';
import { ItemDivider } from '../Item';
import { Option, OptionHeader } from '../Option';
import { Scrollable } from '../Scrollable';
import { Tile } from '../Tile';
import type { OptionType } from './OptionType';
import OptionsEmpty from './OptionsEmpty';

export type OptionsProps<TValue extends string | number = string | number, TLabel = ReactNode> = Omit<BoxProps, 'ref' | 'onSelect'> &
	RefAttributes<HTMLElement> & {
		multiple?: boolean;
		options: OptionType<TValue, TLabel>[];
		cursor: number;
		renderItem?: ComponentType<{
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
	maxHeight = 'x144',
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

	useLayoutEffect(() => {
		if (!liRef.current) {
			return;
		}
		const { current } = liRef;
		const li = current?.querySelector<HTMLLIElement>('.rcx-option--focus, .rcx-item--focused');
		if (!li) {
			return;
		}
		if (li.offsetTop + li.clientHeight > current.scrollTop + current.clientHeight || li.offsetTop - li.clientHeight < current.scrollTop) {
			current.scrollTop = li.offsetTop;
		}
	}, [cursor]);

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
		[options, cursor, onSelect, OptionComponent],
	);

	return (
		<Box rcx-options {...props}>
			<Tile padding={0} paddingBlock='x12' paddingInline={0} elevation='2'>
				<Scrollable vertical smooth>
					<Tile
						ref={liRef}
						elevation='0'
						padding='none'
						maxHeight={maxHeight}
						onMouseDown={prevent}
						onClick={prevent}
						is='ol'
						aria-multiselectable={multiple || true}
						role='listbox'
						id={id}
						aria-activedescendant={options?.[cursor]?.[0] ? String(options?.[cursor]?.[0]) : undefined}
					>
						{!options.length && <EmptyComponent customEmpty={customEmpty} />}
						{optionsMemoized}
					</Tile>
				</Scrollable>
			</Tile>
		</Box>
	);
}

export default Options;
