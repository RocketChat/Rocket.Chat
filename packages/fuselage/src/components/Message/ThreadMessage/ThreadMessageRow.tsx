import { cx } from '../../../helpers/composeClassNames';
import ItemRow, { type ItemRowProps } from '../../Item/ItemRow';

export type ThreadMessageRowProps = ItemRowProps;

const ThreadMessageRow = ({ className, ...props }: ThreadMessageRowProps) => (
	<ItemRow {...props} className={cx('rcx-message-thread__row', className)} />
);

export default ThreadMessageRow;
