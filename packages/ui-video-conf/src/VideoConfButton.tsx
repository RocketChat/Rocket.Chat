import { Button, Icon, IconProps } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement, ButtonHTMLAttributes } from 'react';

type VideoConfButtonProps = {
	icon?: IconProps['name'];
	primary?: boolean;
	secondary?: boolean;
	danger?: boolean;
	disabled?: boolean;
	children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

const VideoConfButton = ({ primary, secondary, danger, disabled, icon, children, ...props }: VideoConfButtonProps): ReactElement => (
	<Button width='100%' primary={primary} danger={danger} secondary={secondary} disabled={disabled} {...props}>
		{icon && <Icon mie='x4' size='x20' name={icon} />}
		{children}
	</Button>
);

export default VideoConfButton;
