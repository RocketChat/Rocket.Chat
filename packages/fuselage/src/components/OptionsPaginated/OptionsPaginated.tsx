import { useStableCallback, useDebouncedState } from '@rocket.chat/fuselage-hooks';
import type { ComponentType, ElementType, MouseEvent, ReactNode, RefAttributes } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { prevent } from '../../helpers/prevent';
import type { ElementProps } from '../../types/ElementProps';
import { AnimatedVisibility } from '../AnimatedVisibility';
import { Box } from '../Box';
import { CheckOption, Option } from '../Option';
import { PopoverSurface } from '../PopoverSurface';
import { Empty } from './Empty';

export type OptionsPaginatedProps = Omit<ElementProps<HTMLDivElement>, 'ref' | 'onSelect'> &
	RefAttributes<Element> & {
		multiple?: boolean;
		/** The entries; only those scrolled into view render. */
		options: { value: string | number; label: string; selected?: boolean }[];
		/** Index of the option the arrow keys reached, highlighted. */
		cursor: number;
		/** Shows each label as its option's tooltip, for labels that may be cut short. */
		withTitle?: boolean;
		/** Renders each option, such as `CheckOption` for a multiple selection. */
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
		/** Shown in place of the list when there are no `options`. */
		renderEmpty?: ElementType<object>;
		/** Called with `[value, label]` of the option that was picked. */
		onSelect: (option: [unknown, string]) => void;
		/** Called when the list is scrolled to its end, to load the next page of `options`. */
		endReached?: (start?: number, end?: number) => void;
	};

export { CheckOption, Empty };

/**
 * The floating list of a select or an autocomplete with too many options to load at once: it renders only the ones in
 * view and asks for more as the user scrolls.
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
		<Box rcx-options {...props} ref={ref}>
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
		</Box>
	);
}

export const useVisible = (initialVisibility = AnimatedVisibility.HIDDEN) => {
	const [visible, setVisible] = useDebouncedState(initialVisibility, 10);
	const hide = useStableCallback(() => setVisible(AnimatedVisibility.HIDDEN));
	const show = useStableCallback(() => setVisible(AnimatedVisibility.VISIBLE));

	return [visible, hide, show];
};
