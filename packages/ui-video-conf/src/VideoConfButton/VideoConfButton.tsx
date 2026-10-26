import { Button, type ButtonProps } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

export type VideoConfButtonProps = {
	icon?: IconName;
	variant?: ButtonProps['variant'];
	disabled?: boolean;
	children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

const VideoConfButton = ({ variant, disabled, icon, children, ...props }: VideoConfButtonProps) => (
	<Button icon={icon} variant={variant} disabled={disabled} {...props}>
		{children}
	</Button>
);

export default VideoConfButton;
