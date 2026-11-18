import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import ItemRow from '../../Item/ItemRow';

export type ThreadMessageRowProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

/**
 * One line of a `ThreadMessage`: a `MessageLeftContainer` with the thread icon or the avatar, and a
 * `ThreadMessageContainer`.
 */
const ThreadMessageRow = ({ className, ...props }: ThreadMessageRowProps) => (
	<ItemRow {...props} className={cx('rcx-message-thread__row', className)} />
);

export default ThreadMessageRow;
