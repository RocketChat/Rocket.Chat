import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type DeviceMenuSectionProps = {
	title: string;
	children: ReactNode;
};

/**
 * A group of choices about the device, under its devices. Headed, because a list that runs from cameras
 * straight into "720p" reads as one list of increasingly strange devices.
 */
const DeviceMenuSection = ({ title, children }: DeviceMenuSectionProps) => (
	<Box>
		<Box paddingInline={16} paddingBlockStart={8} paddingBlockEnd={4} fontScale='micro' color='hint'>
			{title}
		</Box>
		{children}
	</Box>
);

export default DeviceMenuSection;
