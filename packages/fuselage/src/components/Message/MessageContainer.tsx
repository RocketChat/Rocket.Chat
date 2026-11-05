import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type MessageContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageContainer = ({ className, ...props }: MessageContainerProps) => (
	<div className={prependClassName(className, 'rcx-box rcx-box--full rcx-message-container')} {...props} />
);

export default MessageContainer;
