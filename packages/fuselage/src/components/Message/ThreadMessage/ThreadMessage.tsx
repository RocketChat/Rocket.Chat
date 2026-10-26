import { cx } from '../../../helpers/composeClassNames';
import Message, { type MessageProps } from '../Message';

export type ThreadMessageProps = MessageProps;

const ThreadMessage = ({ className, ...props }: ThreadMessageProps) => (
	<Message {...props} className={cx('rcx-message-thread', className)} />
);

export default ThreadMessage;
