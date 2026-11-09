import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import ItemMedia from '../Item/ItemMedia';

export type MessageContainerFixedProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageContainerFixed = ({ className, ...props }: MessageContainerFixedProps) => (
	<ItemMedia {...props} className={cx('rcx-message-container--fixed', className)} />
);

export default MessageContainerFixed;
