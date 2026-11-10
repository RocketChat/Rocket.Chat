import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import ItemMeta from '../../Item/ItemMeta';

export type MessageSystemTimestampProps = {
	children: ReactNode;
	title?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'is'>;

const MessageSystemTimestamp = ({ className, ...props }: MessageSystemTimestampProps) => (
	<ItemMeta is='span' {...props} className={cx('rcx-message-system__time', className)} />
);

export default MessageSystemTimestamp;
