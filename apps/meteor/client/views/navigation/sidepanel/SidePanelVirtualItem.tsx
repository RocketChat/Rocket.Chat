import { SidepanelListItem } from '@rocket.chat/fuselage';
import { forwardRef, type ComponentProps } from 'react';

type SidePanelVirtualItemProps = {
	index?: number;
} & ComponentProps<typeof SidepanelListItem>;

export const SidePanelVirtualItem = forwardRef<HTMLDivElement, SidePanelVirtualItemProps>(function SidePanelVirtualItem(
	{ children, index, style, ...props },
	ref,
) {
	return (
		<SidepanelListItem ref={ref} data-item-index={index} style={style} {...props}>
			{children}
		</SidepanelListItem>
	);
});
