import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import ItemContent from '../Item/ItemContent';

export type MessageContainerProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageContainer = ({ className, ...props }: MessageContainerProps) => (
	<ItemContent {...props} className={cx('rcx-box rcx-box--full rcx-message-container', className)} />
);

export default MessageContainer;
