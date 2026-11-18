import type { RefAttributes } from 'react';

import { IconButton } from '../../Button';
import type { IconButtonProps } from '../../Button/IconButton';

export type MessageToolbarItemProps = Omit<IconButtonProps, 'ref'> & RefAttributes<HTMLButtonElement>;

/**
 * One action in a `MessageToolbar`, as a small icon button.
 */
function MessageToolbarItem(props: MessageToolbarItemProps) {
	return <IconButton size='small' {...props} />;
}

export default MessageToolbarItem;
