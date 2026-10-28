import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageRolesProps = HTMLAttributes<HTMLDivElement>;

const MessageRoles = ({ className, ...props }: MessageRolesProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-message-header__roles', className)} />
);

export default MessageRoles;
