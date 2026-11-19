import { cx } from '../../helpers/composeClassNames';
import ItemRow, { type ItemRowProps } from '../Item/ItemRow';

export type MessageRolesProps = ItemRowProps;

const MessageRoles = ({ className, ...props }: MessageRolesProps) => (
	<ItemRow {...props} className={cx('rcx-message-header__roles', className)} />
);

export default MessageRoles;
