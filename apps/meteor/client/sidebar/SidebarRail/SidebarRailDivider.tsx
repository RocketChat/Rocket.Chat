import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

import HorizontalDivider from '../../components/HorizontalDivider';

type SidebarRailDividerProps = ComponentProps<typeof HorizontalDivider>;

const SidebarRailDivider = (props: SidebarRailDividerProps) => (
	<Box paddingBlock={16} paddingInline={4}>
		<HorizontalDivider flush variation='light' {...props} />
	</Box>
);

export default SidebarRailDivider;
