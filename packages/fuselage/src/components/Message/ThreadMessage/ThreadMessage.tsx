import { ThreadMessageBase, type MessageProps } from '../Message';

export type ThreadMessageProps = MessageProps;

const ThreadMessage = (props: ThreadMessageProps) => <ThreadMessageBase className='rcx-message-thread' {...props} />;

export default ThreadMessage;
