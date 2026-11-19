import { cx } from '../../../helpers/composeClassNames';
import ItemContent, { type ItemContentProps } from '../../Item/ItemContent';

export type MessageSystemContainerProps = ItemContentProps;

const MessageSystemContainer = ({ className, ...props }: MessageSystemContainerProps) => (
	<ItemContent {...props} className={cx('rcx-message-system__container', className)} />
);

export default MessageSystemContainer;
