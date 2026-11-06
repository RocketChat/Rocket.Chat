import { cx } from '../../helpers/composeClassNames';
import type { TagProps } from '../Tag';
import { Tag } from '../Tag';

export type MessageRoleProps = TagProps;

const MessageRole = ({ className, ...props }: MessageRoleProps) => <Tag {...props} className={cx('rcx-message-header__role', className)} />;

export default MessageRole;
