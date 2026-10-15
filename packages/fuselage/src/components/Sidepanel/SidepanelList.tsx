import type { HTMLAttributes, RefAttributes } from 'react';

export type SidepanelListProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function SidepanelList({ className, ...props }: SidepanelListProps) {
	return <div role='list' className={['rcx-sidepanel-list', className].filter(Boolean).join(' ')} {...props} />;
}

export default SidepanelList;
