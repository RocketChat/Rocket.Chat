import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import ItemMedia from '../Item/ItemMedia';

export type MessageLeftContainerProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

/**
 * The leading column of a message, holding the avatar, or the status indicators of a sequential message. It keeps its
 * width when empty, so every message's text starts at the same place.
 */
const MessageLeftContainer = ({ className, ...props }: MessageLeftContainerProps) => (
	<ItemMedia {...props} className={cx('rcx-message-container--left', className)} />
);

export default MessageLeftContainer;
