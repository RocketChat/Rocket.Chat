import { Box, Icon } from '@rocket.chat/fuselage';

export type VideoConfMessageIconProps = {
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

const VideoConfMessageIcon = ({ variant = 'ended' }: VideoConfMessageIconProps) => (
	<Box
		size='x28'
		alignItems='center'
		justifyContent='center'
		display='flex'
		borderRadius='medium'
		backgroundColor={styles[variant].backgroundColor}
		color={styles[variant].color}
	>
		<Icon size='x20' name={styles[variant].icon} />
	</Box>
);

export default VideoConfMessageIcon;
