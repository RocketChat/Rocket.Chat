import type { ComponentType, CSSProperties, DOMAttributes, MouseEventHandler, ReactNode, Ref } from 'react';
import { useId, useLayoutEffect, useMemo, useRef } from 'react';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { prevent } from '../../helpers/prevent';
import { size as sizeToken } from '../../styleTokens';
import type { PartAttributes } from '../../types/ElementAttributes';
import { Box } from '../Box';
import { ItemDivider } from '../Item';
import { Option, OptionHeader } from '../Option';
import { PopoverSurface } from '../PopoverSurface';
import { Scrollable } from '../Scrollable';
import type { OptionType } from './OptionType';
import OptionsEmpty from './OptionsEmpty';

export type OptionsProps<TValue extends string | number = string | number, TLabel = ReactNode> = PartAttributes<HTMLElement> &
	Pick<DOMAttributes<HTMLDivElement>, 'onMouseDown'> & {
		/** The width of the list, as the control it opens from measures it. */
		width?: number | string;
		/** A size token, a length or a number of pixels. */
		maxHeight?: number | string;
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
	multiple,
	renderEmpty: EmptyComponent = OptionsEmpty,
	options,
	cursor,
	renderItem: OptionComponent = Option,
	onSelect,
	customEmpty,
	id,
	width,
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
		// oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- only keeps the focus in the control the list opens from
		<div
			{...ariaAndDataAttributes(props)}
			// Callers forward a ref typed for any element
			ref={props.ref as Ref<HTMLDivElement>}
			title={props.title}
			onMouseDown={props.onMouseDown}
			className={['rcx-box rcx-box--full rcx-options', props.className].filter(Boolean).join(' ')}
			// The measured width travels as a custom property, which the stylesheet reads
			style={{ '--rcx-options-width': sizeToken(width) } as CSSProperties}
		>
			<PopoverSurface>
				{/* A `Box`: `Scrollable` hands it its scroll styles through `BoxTransforms` */}
				<Scrollable vertical smooth>
					<Box
						ref={liRef}
						rcx-options__list
						style={{ '--rcx-options-max-height': sizeToken(maxHeight) } as CSSProperties}
						onMouseDown={prevent}
						onClick={prevent}
						is='ol'
						aria-multiselectable={!!multiple}
						role='listbox'
						id={id}
						aria-activedescendant={options?.[cursor]?.[0] ? String(options?.[cursor]?.[0]) : undefined}
					>
						{!options.length && <EmptyComponent customEmpty={customEmpty} />}
						{optionsMemoized}
					</Box>
				</Scrollable>
			</PopoverSurface>
		</div>
	);
}

export default Options;
