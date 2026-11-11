import type { HTMLAttributes, RefAttributes } from 'react';

export type SidepanelListItemProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function SidepanelListItem({ className, ...props }: SidepanelListItemProps) {
	return <div role='listitem' className={['rcx-sidepanel-list__item', className].filter(Boolean).join(' ')} {...props} />;
}

export default SidepanelListItem;
