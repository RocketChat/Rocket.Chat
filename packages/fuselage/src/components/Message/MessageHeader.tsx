import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import ItemRow from '../Item/ItemRow';

export type MessageHeaderProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageHeader = ({ className, ...props }: MessageHeaderProps) => (
	<ItemRow {...props} className={cx('rcx-message-header', className)} />
);

export default MessageHeader;
