import { cx } from '../../helpers/composeClassNames';
import ItemMedia, { type ItemMediaProps } from '../Item/ItemMedia';

export type MessageLeftContainerProps = Omit<ItemMediaProps, 'variant'>;

const MessageLeftContainer = ({ className, ...props }: MessageLeftContainerProps) => (
	<ItemMedia {...props} className={cx('rcx-message-container--left', className)} />
);

export default MessageLeftContainer;
