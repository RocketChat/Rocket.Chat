import { Box, Icon, Palette } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

type VideoConfMessageIconProps = {
	variant?: keyof typeof styles;
};

const styles = {
	ended: {
		icon: 'phone-off',
		color: Palette.text['font-hint'].toString(),
		backgroundColor: Palette.surface['surface-neutral'].toString(),
	},
	incoming: {
		icon: 'phone-in',
		color: Palette.statusColor['status-font-on-info'].toString(),
		backgroundColor: Palette.status['status-background-info'].toString(),
	},
	outgoing: {
		icon: 'phone',
		color: Palette.statusColor['status-font-on-success'].toString(),
		backgroundColor: Palette.status['status-background-success'].toString(),
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
