import { cx } from '../../../helpers/composeClassNames';
import Item from '../../Item/Item';
import ItemContent from '../../Item/ItemContent';
import type { MessageProps } from '../Message';

export type ThreadMessageProps = MessageProps;

const ThreadMessage = ({
	className,
	clickable,
	sequential: _sequential,
	isSelected,
	isEditing: _isEditing,
	isPending: _isPending,
	children,
	...props
}: ThreadMessageProps) => (
	<Item {...props} inset='lg' interactive={clickable} selected={isSelected} className={cx('rcx-message-thread', className)}>
		<ItemContent className='rcx-message-thread__content'>{children}</ItemContent>
	</Item>
);

export default ThreadMessage;
