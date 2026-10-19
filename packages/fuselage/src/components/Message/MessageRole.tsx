import type { TagProps } from '../Tag';
import { Tag } from '../Tag';

export type MessageRoleProps = TagProps;

const MessageRole = (props: MessageRoleProps) => <Tag className='rcx-message-header__role' {...props} />;

export default MessageRole;
