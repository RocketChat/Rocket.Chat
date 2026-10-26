import { prependClassName } from '../../../helpers/prependClassName';
import { ThreadMessageBase, type MessageProps } from '../Message';

export type ThreadMessageProps = MessageProps;

const ThreadMessage = ({ className, ...props }: ThreadMessageProps) => (
	<ThreadMessageBase className={prependClassName(className, 'rcx-message-thread')} {...props} />
);

export default ThreadMessage;
