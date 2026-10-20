import type { TagProps } from '../Tag';
import { Tag } from '../Tag';

export type MessageRoleProps = TagProps;

const MessageRole = (props: MessageRoleProps) => <Tag className='rcx-message-header__role' marginInline='x2' {...props} />;

export default MessageRole;
