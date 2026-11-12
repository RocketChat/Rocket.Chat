import { cx } from '../../helpers/composeClassNames';
import { ItemGroup, type ItemGroupProps } from '../Item';

export type SidepanelListProps = Omit<ItemGroupProps, 'is' | 'padding'>;

function SidepanelList({ className, ...props }: SidepanelListProps) {
	return <ItemGroup role='list' {...props} padding='large' className={cx('rcx-sidepanel-list', className)} />;
}

export default SidepanelList;
