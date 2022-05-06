import type React from 'react';
import type { ButtonHTMLAttributes } from 'react';
import type { ReactNode, ReactElement } from 'react';
import { Button, Icon, IconProps } from '@rocket.chat/fuselage';

type VideoConfButtonProps = {
	icon?: IconProps['name'];
	primary?: boolean;
	children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

const VideoConfButton = ({ primary, icon, children, ...props }: VideoConfButtonProps): ReactElement => {
	return (
		<Button primary={primary} {...props}>
			{icon && <Icon mie='x4' size='x20' name={icon} />}
			{children}
		</Button>
	);
};

export default VideoConfButton;
