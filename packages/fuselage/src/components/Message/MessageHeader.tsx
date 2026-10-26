import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type MessageHeaderProps = HTMLAttributes<HTMLDivElement>;

const MessageHeader = ({ children, className, ...props }: MessageHeaderProps) => (
	<div {...props} className={cx('rcx-box rcx-box--full rcx-message-header', className)}>
		<div className='rcx-box rcx-box--full rcx-message-header__wrapper'>{children}</div>
	</div>
);

export default MessageHeader;
