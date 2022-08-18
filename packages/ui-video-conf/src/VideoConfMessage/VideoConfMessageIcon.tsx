import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';

type VideoConfMessageIconProps = {
	variant?: keyof typeof styles;
};

const styles = {
	ended: {
		icon: 'phone-off',
		color: 'neutral-700',
		backgroundColor: 'neutral-400',
	},
	incoming: {
		icon: 'phone-in',
		color: 'primary-600',
		backgroundColor: 'primary-200',
	},
	outgoing: {
		icon: 'phone',
		color: 'success-800',
		backgroundColor: 'success-200',
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
