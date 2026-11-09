import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames.js';
import ItemMedia from '../Item/ItemMedia.js';

export type MessageContainerFixedProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageContainerFixed = ({ className, ...props }: MessageContainerFixedProps) => (
	<ItemMedia {...props} className={cx('rcx-message-container--fixed', className)} />
);

export default MessageContainerFixed;
