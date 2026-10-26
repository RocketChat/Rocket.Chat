import { prependClassName } from '../../helpers/prependClassName';
import type { TagProps } from '../Tag';
import { Tag } from '../Tag';

export type MessageRoleProps = TagProps;

const MessageRole = ({ className, ...props }: MessageRoleProps) => (
	<Tag className={prependClassName(className, 'rcx-message-header__role')} {...props} />
);

export default MessageRole;
