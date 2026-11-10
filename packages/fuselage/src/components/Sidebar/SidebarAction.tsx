import { IconButton } from '../Button';
import type { IconButtonProps } from '../Button/IconButton';

export type SidebarActionProps = IconButtonProps;

function SidebarAction(props: SidebarActionProps) {
	return <IconButton size='small' {...props} />;
}

export default SidebarAction;
