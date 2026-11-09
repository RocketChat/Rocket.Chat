import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import ItemRow from '../../Item/ItemRow';

export type ThreadMessageRowProps = Omit<HTMLAttributes<HTMLDivElement>, 'is'>;

const ThreadMessageRow = ({ className, ...props }: ThreadMessageRowProps) => (
	<ItemRow {...props} className={cx('rcx-message-thread__row', className)} />
);

export default ThreadMessageRow;
