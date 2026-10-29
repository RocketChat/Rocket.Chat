import { useStableCallback, useDebouncedState } from '@rocket.chat/fuselage-hooks';
import type { AriaRole, ComponentType, CSSProperties, DOMAttributes, ElementType, MouseEvent, ReactNode, Ref } from 'react';
import { memo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { ariaAndDataAttributes } from '../../helpers/ariaAndDataAttributes';
import { prevent } from '../../helpers/prevent';
import { size as sizeToken } from '../../styleTokens';
import type { CommonAttributes } from '../../types/ElementAttributes';
import { AnimatedVisibility } from '../AnimatedVisibility';
import { CheckOption, Option } from '../Option';
import { PopoverSurface } from '../PopoverSurface';

export type OptionsPaginatedProps = CommonAttributes &
	Pick<DOMAttributes<HTMLDivElement>, 'onMouseDown'> & {
		ref?: Ref<HTMLDivElement>;
		className?: string;
		/** `listbox`: the list has no element of its own around the options. */
		role?: AriaRole;
		/** The width of the list, as the control it opens from measures it. */
		width?: number | string;
		multiple?: boolean;
		options: { value: string | number; label: string; selected?: boolean }[];
		cursor: number;
		withTitle?: boolean;
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
		renderEmpty?: ElementType<object>;
		onSelect: (option: [unknown, string]) => void;
		endReached?: (start?: number, end?: number) => void;
	};

export const Empty = memo(() => <Option label='Empty' />);

export { CheckOption };

/**
 * An input for selection of options.
 */
export function OptionsPaginated({
	ref,
	withTitle,
	multiple,
	renderEmpty: EmptyComponent = Empty,
	options,
	cursor,
	renderItem: OptionComponent = Option,
	onSelect,
	endReached,
	width,
	className,
	onMouseDown,
	...props
}: OptionsPaginatedProps) {
	const OptionsComponentWithData = ({ index, data }: { index: number; data: OptionsPaginatedProps['options'][0] }) => {
		const { value, label, selected } = data;
		return (
			<OptionComponent
				{...(withTitle && { title: label })}
				index={index}
				role='option'
				label={label}
				onMouseDown={(e) => {
					prevent(e);
					onSelect([value, label]);
					return false;
				}}
				key={value}
				value={value}
				selected={!!selected}
				focus={cursor === index || undefined} // FIXME: undefined???
			/>
		);
	};

	return (
		<div
			{...ariaAndDataAttributes(props)}
			ref={ref}
			role={props.role}
			onMouseDown={onMouseDown}
			className={['rcx-box rcx-box--full rcx-options', className].filter(Boolean).join(' ')}
			// The measured width travels as a custom property, which the stylesheet reads
			style={{ '--rcx-options-width': sizeToken(width) } as CSSProperties}
		>
			<PopoverSurface>
				{!options.length ? (
					<EmptyComponent />
				) : (
					<Virtuoso
						endReached={endReached}
						style={{ height: '144px' }}
						totalCount={options.length}
						data={options}
						// TODO Add a scroller element
						// components={{ Scroller: ScrollableContentWrapper }}
						itemContent={(index, data) => <OptionsComponentWithData index={index} data={data} />}
					/>
				)}
			</PopoverSurface>
		</div>
	);
}

export const useVisible = (initialVisibility = AnimatedVisibility.HIDDEN) => {
	const [visible, setVisible] = useDebouncedState(initialVisibility, 10);
	const hide = useStableCallback(() => setVisible(AnimatedVisibility.HIDDEN));
	const show = useStableCallback(() => setVisible(AnimatedVisibility.VISIBLE));

	return [visible, hide, show];
};
