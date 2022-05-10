import React from 'react';
import type { ReactNode, ReactElement, ButtonHTMLAttributes } from 'react';
import { Button, Icon, IconProps } from '@rocket.chat/fuselage';

type VideoConfButtonProps = {
	icon?: IconProps['name'];
	primary?: boolean;
	danger?: boolean;
	children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

const VideoConfButton = ({ primary, danger, icon, children, ...props }: VideoConfButtonProps): ReactElement => {
	return (
		<Button primary={primary} danger={danger} {...props}>
			{icon && <Icon mie='x4' size='x20' name={icon} />}
			{children}
		</Button>
	);
};

export default VideoConfButton;
