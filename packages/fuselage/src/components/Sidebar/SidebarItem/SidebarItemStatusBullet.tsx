import { ItemIcon } from '../../Item/index.js';
import type { StatusBulletProps } from '../../StatusBullet/index.js';
import { StatusBullet } from '../../StatusBullet/index.js';

export const SidebarItemStatusBullet = (props: StatusBulletProps) => (
	<ItemIcon className='rcx-sidebar-item__status-bullet'>
		<StatusBullet {...props} />
	</ItemIcon>
);
