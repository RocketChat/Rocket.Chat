import { cx } from '../../helpers/composeClassNames';
import { ItemGroup, type ItemGroupProps } from '../Item';

export type SidepanelListProps = Omit<ItemGroupProps, 'is'>;

function SidepanelList({ className, ...props }: SidepanelListProps) {
	return <ItemGroup role='list' {...props} className={cx('rcx-sidepanel-list', className)} />;
}

export default SidepanelList;
