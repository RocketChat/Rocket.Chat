import type { ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import ItemMeta from '../../Item/ItemMeta';
import type { ItemPartAttributes } from '../../Item/types';

export type MessageSystemTimestampProps = ItemPartAttributes & {
	children: ReactNode;
};

const MessageSystemTimestamp = ({ className, ...props }: MessageSystemTimestampProps) => (
	<ItemMeta is='span' {...props} className={cx('rcx-message-system__time', className)} />
);

export default MessageSystemTimestamp;
