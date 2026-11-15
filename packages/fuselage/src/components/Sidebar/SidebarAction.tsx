import type { RefAttributes } from 'react';

import { IconButton } from '../Button';
import type { IconButtonProps } from '../Button/IconButton';

export type SidebarActionProps = Omit<IconButtonProps, 'ref'> & RefAttributes<HTMLElement>;

function SidebarAction(props: SidebarActionProps) {
	return <IconButton size='small' {...props} />;
}

export default SidebarAction;
