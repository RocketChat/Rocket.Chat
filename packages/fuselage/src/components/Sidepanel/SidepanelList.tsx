import type { HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { ItemGroup } from '../Item';

export type SidepanelListProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'> & RefAttributes<HTMLDivElement>;

function SidepanelList({ className, ...props }: SidepanelListProps) {
	return <ItemGroup role='list' {...props} className={cx('rcx-sidepanel-list', className)} />;
}

export default SidepanelList;
