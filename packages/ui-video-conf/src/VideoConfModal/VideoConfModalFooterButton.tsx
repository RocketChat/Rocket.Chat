import type React from 'react';
import type { AllHTMLAttributes, ButtonHTMLAttributes, ComponentProps, HTMLAttributes } from 'react';
import type { ReactNode, ReactElement } from 'react';
import { Button, Icon, IconProps } from '@rocket.chat/fuselage';

type VideoConfModalFooterButtonProps = {
	icon?: IconProps['name'];
	primary?: boolean;
	children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

const VideoConfModalFooterButton = ({ primary, icon, children, ...props }: VideoConfModalFooterButtonProps): ReactElement => {
	return (
		<Button primary={primary} {...props}>
			{icon && <Icon size='x20' name={icon} />}
			{children}
		</Button>
	);
};

export default VideoConfModalFooterButton;
