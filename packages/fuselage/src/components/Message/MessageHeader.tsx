import { cx } from '../../helpers/composeClassNames';
import ItemRow, { type ItemRowProps } from '../Item/ItemRow';

export type MessageHeaderProps = ItemRowProps;

const MessageHeader = ({ className, ...props }: MessageHeaderProps) => (
	<ItemRow {...props} className={cx('rcx-message-header', className)} />
);

export default MessageHeader;
