import { cx } from '../../../helpers/composeClassNames';
import Item, { type ItemAttributes } from '../../Item/Item';

export type MessageSystemProps = {
	isSelected?: boolean;
} & ItemAttributes;

const MessageSystem = ({ isSelected, className, ...props }: MessageSystemProps) => (
	<Item {...props} align='start' inset='lg' multiline selected={isSelected} className={cx('rcx-message-system', className)} />
);

export default MessageSystem;
