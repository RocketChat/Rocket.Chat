import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames.js';
import ItemMeta from '../Item/ItemMeta.js';

export type MessageTimestampProps = Omit<HTMLAttributes<HTMLSpanElement>, 'is'>;

const MessageTimestamp = ({ className, ...props }: MessageTimestampProps) => (
	<ItemMeta is='span' {...props} className={cx('rcx-message-header__time', className)} />
);

export default MessageTimestamp;
