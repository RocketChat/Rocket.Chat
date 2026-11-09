import { Tag, type TagProps } from '../Tag/index.js';

export type MessageRoleProps = TagProps;

const MessageRole = (props: MessageRoleProps) => <Tag {...props} />;

export default MessageRole;
