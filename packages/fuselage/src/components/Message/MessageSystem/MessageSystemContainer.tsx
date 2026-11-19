import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import ItemContent from '../../Item/ItemContent';

export type MessageSystemContainerProps = {
	children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

/**
 * The content of a system message, holding its `MessageSystemBlock`.
 */
const MessageSystemContainer = ({ className, ...props }: MessageSystemContainerProps) => (
	<ItemContent {...props} className={cx('rcx-message-system__container', className)} />
);

export default MessageSystemContainer;
