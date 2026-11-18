import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import ItemMedia from '../Item/ItemMedia';

export type MessageContainerFixedProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

/**
 * A trailing column beside the message content, for controls that keep their size however long the message is, such as
 * a thread's follow button in the threads list.
 */
const MessageContainerFixed = ({ className, ...props }: MessageContainerFixedProps) => (
	<ItemMedia {...props} className={cx('rcx-message-container--fixed', className)} />
);

export default MessageContainerFixed;
