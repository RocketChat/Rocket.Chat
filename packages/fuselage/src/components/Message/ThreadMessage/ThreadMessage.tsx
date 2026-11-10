import Message, { type MessageProps } from '../Message';

export type ThreadMessageProps = MessageProps;

const ThreadMessage = (props: ThreadMessageProps) => <Message className='rcx-message-thread' {...props} />;

export default ThreadMessage;
