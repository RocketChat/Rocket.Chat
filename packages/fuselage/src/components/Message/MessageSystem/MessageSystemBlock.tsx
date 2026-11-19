import { cx } from '../../../helpers/composeClassNames';
import ItemRow, { type ItemRowProps } from '../../Item/ItemRow';

export type MessageSystemBlockProps = ItemRowProps;

const MessageSystemBlock = ({ className, ...props }: MessageSystemBlockProps) => (
	<ItemRow {...props} className={cx('rcx-message-system__block', className)} />
);

export default MessageSystemBlock;
