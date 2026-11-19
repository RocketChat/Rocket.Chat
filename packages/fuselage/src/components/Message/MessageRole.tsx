import { Tag, type TagProps } from '../Tag';

export type MessageRoleProps = TagProps;

/**
 * One of the author's roles, such as Admin or Owner, as a tag in a message header.
 */
const MessageRole = (props: MessageRoleProps) => <Tag {...props} />;

export default MessageRole;
