import { cx } from '../../helpers/composeClassNames';
import ItemMedia, { type ItemMediaProps } from '../Item/ItemMedia';

export type MessageContainerFixedProps = ItemMediaProps;

const MessageContainerFixed = ({ className, ...props }: MessageContainerFixedProps) => (
	<ItemMedia {...props} className={cx('rcx-message-container--fixed', className)} />
);

export default MessageContainerFixed;
