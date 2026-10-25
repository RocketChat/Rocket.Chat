import type { AllHTMLAttributes } from 'react';

import { Icon, type IconProps } from '../../Icon';

export type MessageStatusIndicatorItemProps = {
	name: IconProps['name'];
	variant?: 'success' | 'danger' | 'warning' | 'primary';
	color?: IconProps['color'];
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'color'>;

const MessageStatusIndicatorItem = ({ name, variant, ...props }: MessageStatusIndicatorItemProps) => (
	<Icon
		name={name}
		size='x16'
		className={['rcx-message-status-indicator__item', variant && `rcx-message-status-indicator__item--${variant}`]
			.filter(Boolean)
			.join(' ')}
		{...props}
	/>
);

export default MessageStatusIndicatorItem;
