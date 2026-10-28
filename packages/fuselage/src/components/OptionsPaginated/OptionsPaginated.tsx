import { useStableCallback, useDebouncedState } from '@rocket.chat/fuselage-hooks';
import type { ComponentType, ElementType, MouseEvent, ReactNode, RefAttributes } from 'react';
import { memo } from 'react';
import { Virtuoso } from 'react-virtuoso';

import { prevent } from '../../helpers/prevent';
import type { ElementProps } from '../../types/ElementProps';
import { AnimatedVisibility } from '../AnimatedVisibility';
import { Box } from '../Box';
import { CheckOption, Option } from '../Option';
import { PopoverSurface } from '../PopoverSurface';

export type OptionsPaginatedProps = Omit<ElementProps<HTMLDivElement>, 'ref' | 'onSelect'> &
	RefAttributes<Element> & {
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

export const Empty = memo(function Empty() {
	return <Option label='Empty' />;
});

export { CheckOption };

/**
 * An input for selection of options.
 */
// eslint-disable-next-line react/no-multi-comp
export function OptionsPaginated({
	ref,
	withTitle,
	multiple: _multiple,
	renderEmpty: EmptyComponent = Empty,
	options,
	cursor,
	renderItem: OptionComponent = Option,
	onSelect,
	endReached,
	...props
}: OptionsPaginatedProps) {
	// eslint-disable-next-line react/no-multi-comp
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
