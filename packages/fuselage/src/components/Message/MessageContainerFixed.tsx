import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../helpers/prependClassName';

export type MessageContainerFixedProps = HTMLAttributes<HTMLDivElement>;

const MessageContainerFixed = ({ className, ...props }: MessageContainerFixedProps) => (
	<div className={prependClassName(className, 'rcx-box rcx-box--full rcx-message-container rcx-message-container--fixed')} {...props} />
);

export default MessageContainerFixed;
