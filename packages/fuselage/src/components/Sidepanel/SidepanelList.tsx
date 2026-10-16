import type { HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemGroup } from '../Item';

export type SidepanelListProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function SidepanelList({ className, ...props }: SidepanelListProps) {
	return <ItemGroup role='list' {...(props as Omit<SidepanelListProps, 'is'>)} className={cx('rcx-sidepanel-list', className)} />;
}

export default SidepanelList;
