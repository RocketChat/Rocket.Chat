import { Box, Icon } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';

type VideoConfMessageIconProps = {
	name: ComponentProps<typeof Icon>['name'];
} & ComponentProps<typeof Box>;

const VideoConfMessageIcon = ({ name, color, backgroundColor }: VideoConfMessageIconProps): ReactElement => (
	<Box size='x28' alignItems='center' justifyContent='center' display='flex' borderRadius='x4' backgroundColor={backgroundColor}>
		<Icon size='x20' name={name} color={color} />
	</Box>
);

export default VideoConfMessageIcon;
