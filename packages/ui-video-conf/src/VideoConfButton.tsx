import { Button } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { ReactNode, ReactElement, ButtonHTMLAttributes } from 'react';

type VideoConfButtonProps = {
	icon?: IconName;
	primary?: boolean;
	secondary?: boolean;
	danger?: boolean;
	disabled?: boolean;
	children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLElement>, 'ref' | 'is' | 'className' | 'size' | 'elevation'>;

const VideoConfButton = ({ primary, secondary, danger, disabled, icon, children, ...props }: VideoConfButtonProps): ReactElement => (
	<Button icon={icon} width='100%' primary={primary} danger={danger} secondary={secondary} disabled={disabled} {...props}>
		{children}
	</Button>
);

export default VideoConfButton;
