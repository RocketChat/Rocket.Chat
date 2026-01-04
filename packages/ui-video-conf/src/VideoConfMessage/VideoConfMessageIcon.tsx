import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

type VideoConfMessageIconProps = {
	variant?: keyof typeof styles;
};

const styles = {
	ended: {
		icon: 'phone-off',
		color: 'hint',
		backgroundColor: 'surface-neutral',
	},
	incoming: {
		icon: 'phone-in',
		color: 'status-font-on-info',
		backgroundColor: 'status-background-info',
	},
	outgoing: {
		icon: 'phone',
		color: 'status-font-on-success',
		backgroundColor: 'status-background-success',
	},
} as const;

const VideoConfMessageIcon = ({ variant = 'ended' }: VideoConfMessageIconProps): ReactElement => (
	<Box
		size='x28'
		alignItems='center'
		justifyContent='center'
		display='flex'
		borderRadius='x4'
		backgroundColor={styles[variant].backgroundColor}
	>
		<Icon size='x20' name={styles[variant].icon} color={styles[variant].color} />
	</Box>
);

export default VideoConfMessageIcon;
