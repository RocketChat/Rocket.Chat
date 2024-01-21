import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';

const HeaderToolbox: FC<ComponentProps<typeof ButtonGroup>> = (props) => (
	<Box mi={4}>
		<ButtonGroup role='toolbar' {...props} />
	</Box>
);

export default HeaderToolbox;
