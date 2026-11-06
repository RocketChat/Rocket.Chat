import { cx } from '../../../helpers/composeClassNames';
import Item from '../../Item/Item';
import type { MessageProps } from '../Message';

export type ThreadMessageProps = MessageProps;

const ThreadMessage = ({
	className,
	clickable,
	sequential: _sequential,
	isSelected,
	isEditing: _isEditing,
	isPending: _isPending,
	highlight: _highlight,
	...props
}: ThreadMessageProps) => <Item {...props} interactive={clickable} selected={isSelected} className={cx('rcx-message-thread', className)} />;

export default ThreadMessage;
