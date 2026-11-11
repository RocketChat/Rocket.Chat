import { Box, Tag } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const SidePanelTag = (props: ComponentProps<typeof Tag>) => (
	<Box display='flex' maxWidth='50%' minWidth={0}>
		<Tag role='button' tabIndex={0} {...props} />
	</Box>
);

export default SidePanelTag;
