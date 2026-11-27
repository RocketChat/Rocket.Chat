import type { ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import ItemMeta, { type ItemMetaProps } from '../../Item/ItemMeta';

export type MessageSystemTimestampProps = {
	children: ReactNode;
} & Omit<ItemMetaProps, 'is' | 'children'>;

const MessageSystemTimestamp = ({ className, ...props }: MessageSystemTimestampProps) => (
	<ItemMeta is='span' {...props} className={cx('rcx-message-system__time', className)} />
);

export default MessageSystemTimestamp;
