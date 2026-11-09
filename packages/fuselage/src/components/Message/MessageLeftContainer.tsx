import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import ItemMedia from '../Item/ItemMedia';

export type MessageLeftContainerProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageLeftContainer = ({ className, ...props }: MessageLeftContainerProps) => (
	<ItemMedia {...props} className={cx('rcx-message-container--left', className)} />
);

export default MessageLeftContainer;
