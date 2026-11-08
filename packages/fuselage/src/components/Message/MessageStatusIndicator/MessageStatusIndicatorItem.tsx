import type { AllHTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { Icon, type IconProps } from '../../Icon';

export type MessageStatusIndicatorItemProps = {
	name: IconProps['name'];
	variant?: 'success' | 'danger' | 'warning' | 'primary';
	color?: IconProps['color'];
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'color'>;

const MessageStatusIndicatorItem = ({ name, variant, className, ...props }: MessageStatusIndicatorItemProps) => (
	<Icon
		name={name}
		size='x16'
		{...props}
		className={cx('rcx-message-status-indicator__item', variant && `rcx-message-status-indicator__item--${variant}`, className)}
	/>
);

export default MessageStatusIndicatorItem;
