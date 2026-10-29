import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type MessageLeftContainerProps = HTMLAttributes<HTMLDivElement>;

const MessageLeftContainer = ({ className, ...props }: MessageLeftContainerProps) => (
	<div className={prependClassName(className, 'rcx-box rcx-box--full rcx-message-container rcx-message-container--left')} {...props} />
);

export default MessageLeftContainer;
