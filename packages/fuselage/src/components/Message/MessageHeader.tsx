import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames.js';
import ItemRow from '../Item/ItemRow.js';

export type MessageHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageHeader = ({ className, ...props }: MessageHeaderProps) => (
	<ItemRow {...props} className={cx('rcx-message-header', className)} />
);

export default MessageHeader;
