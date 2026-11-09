import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames.js';
import ItemContent from '../../Item/ItemContent.js';

export type MessageSystemContainerProps = {
	children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageSystemContainer = ({ className, ...props }: MessageSystemContainerProps) => (
	<ItemContent {...props} className={cx('rcx-message-system__container', className)} />
);

export default MessageSystemContainer;
