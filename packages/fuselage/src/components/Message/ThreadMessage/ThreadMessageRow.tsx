import { cx } from '../../../helpers/composeClassNames';
import ItemRow from '../../Item/ItemRow';
import type { ItemPartAttributes } from '../../Item/types';

export type ThreadMessageRowProps = ItemPartAttributes;

const ThreadMessageRow = ({ className, ...props }: ThreadMessageRowProps) => (
	<ItemRow {...props} className={cx('rcx-message-thread__row', className)} />
);

export default ThreadMessageRow;
