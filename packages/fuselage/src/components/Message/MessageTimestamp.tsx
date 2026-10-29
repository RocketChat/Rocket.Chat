import { cx } from '../../helpers/composeClassNames';
import ItemMeta, { type ItemMetaProps } from '../Item/ItemMeta';

export type MessageTimestampProps = Omit<ItemMetaProps, 'truncate'>;

const MessageTimestamp = ({ className, ...props }: MessageTimestampProps) => (
	<ItemMeta {...props} className={cx('rcx-message-header__time', className)} />
);

export default MessageTimestamp;
