import { cx } from '../../helpers/composeClassNames';
import type { TagProps } from '../Tag';
import { Tag } from '../Tag';

export type MessageRoleProps = TagProps;

const MessageRole = ({ className, ...props }: MessageRoleProps) => (
	<Tag {...props} className={cx('rcx-box rcx-box--full rcx-message-header__role', className)} />
);

export default MessageRole;
