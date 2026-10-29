import { cx } from '../../../helpers/composeClassNames';
import ItemMeta, { type ItemMetaProps } from '../../Item/ItemMeta';

export type MessageSystemTimestampProps = Omit<ItemMetaProps, 'truncate'>;

const MessageSystemTimestamp = ({ className, ...props }: MessageSystemTimestampProps) => (
	<ItemMeta {...props} className={cx('rcx-message-system__time', className)} />
);

export default MessageSystemTimestamp;
