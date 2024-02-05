import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactElement, ComponentProps } from 'react';

const VideoConfPopupFooterButtons = (props: ComponentProps<typeof ButtonGroup>): ReactElement => (
	<Box mbs={28}>
		<ButtonGroup stretch {...props} />
	</Box>
);

export default VideoConfPopupFooterButtons;
