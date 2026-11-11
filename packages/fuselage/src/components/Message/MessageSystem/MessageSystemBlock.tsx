import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import ItemRow from '../../Item/ItemRow';

export type MessageSystemBlockProps = {
	children?: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const MessageSystemBlock = ({ className, ...props }: MessageSystemBlockProps) => (
	<ItemRow {...props} className={cx('rcx-message-system__block', className)} />
);

export default MessageSystemBlock;
