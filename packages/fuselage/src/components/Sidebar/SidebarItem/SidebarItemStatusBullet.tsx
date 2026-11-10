import { ItemIcon } from '../../Item';
import type { StatusBulletProps } from '../../StatusBullet';
import { StatusBullet } from '../../StatusBullet';

export const SidebarItemStatusBullet = (props: StatusBulletProps) => (
	<ItemIcon className='rcx-sidebar-item__status-bullet'>
		<StatusBullet {...props} />
	</ItemIcon>
);
