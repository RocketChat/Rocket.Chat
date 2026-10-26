import type { HTMLAttributes, ReactNode } from 'react';

import type { MessageStatusIndicatorItemProps } from './MessageStatusIndicatorItem';
import { cx } from '../../../helpers/composeClassNames';

export type MessageStatusPrivateIndicatorProps = {
	children?: ReactNode;
	variant?: MessageStatusIndicatorItemProps['variant'];
} & HTMLAttributes<HTMLSpanElement>;

const MessageStatusPrivateIndicator = ({ children, variant, className, ...props }: MessageStatusPrivateIndicatorProps) => (
	<span
		{...props}
		className={cx(
			'rcx-message-status-indicator__item rcx-message-status-indicator__item--private',
			variant && `rcx-message-status-indicator__item--${variant}`,
			className,
		)}
	>
		{children}
	</span>
);

export default MessageStatusPrivateIndicator;
