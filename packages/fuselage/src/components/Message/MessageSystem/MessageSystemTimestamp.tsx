import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames.js';
import ItemMeta from '../../Item/ItemMeta.js';

export type MessageSystemTimestampProps = {
	children: ReactNode;
	title?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, 'is'>;

const MessageSystemTimestamp = ({ className, ...props }: MessageSystemTimestampProps) => (
	<ItemMeta is='span' {...props} className={cx('rcx-message-system__time', className)} />
);

export default MessageSystemTimestamp;
