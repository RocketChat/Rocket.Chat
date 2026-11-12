import type { RefAttributes } from 'react';

import type { IconButtonProps } from '../Button/IconButton.js';
import { IconButton } from '../Button/index.js';

export type SidebarActionProps = Omit<IconButtonProps, 'ref'> & RefAttributes<HTMLElement>;

function SidebarAction(props: SidebarActionProps) {
	return <IconButton size='small' {...props} />;
}

export default SidebarAction;
