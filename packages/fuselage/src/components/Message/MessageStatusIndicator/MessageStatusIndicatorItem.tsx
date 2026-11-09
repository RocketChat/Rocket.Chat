import type { AllHTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { Icon, type IconProps } from '../../Icon';

export type MessageStatusIndicatorItemProps = {
	name: IconProps['name'];
	color?: IconProps['color'];
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'color'>;

/**
 * A status icon such as edited, pinned or starred. Its `title` names the status for assistive technology; without one the icon is decorative.
 */
const MessageStatusIndicatorItem = ({ name, className, title, ...props }: MessageStatusIndicatorItemProps) => (
	<Icon
		name={name}
		size='x16'
		title={title}
		{...(title && { 'role': 'img', 'aria-label': title, 'aria-hidden': undefined })}
		{...props}
		className={cx('rcx-message-status-indicator__item', className)}
	/>
);

export default MessageStatusIndicatorItem;
