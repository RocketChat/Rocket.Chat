import type { MessageNameProps } from '../MessageName';

export type MessageSystemNameProps = MessageNameProps;

const MessageSystemName = (props: MessageSystemNameProps) => <span className='rcx-box rcx-box--full rcx-message-system__name' {...props} />;

export default MessageSystemName;
