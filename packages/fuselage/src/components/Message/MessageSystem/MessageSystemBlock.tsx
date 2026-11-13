import { cx } from '../../../helpers/composeClassNames';
import ItemRow from '../../Item/ItemRow';
import type { ItemPartAttributes } from '../../Item/types';

export type MessageSystemBlockProps = ItemPartAttributes;

const MessageSystemBlock = ({ className, ...props }: MessageSystemBlockProps) => (
	<ItemRow {...props} className={cx('rcx-message-system__block', className)} />
);

export default MessageSystemBlock;
