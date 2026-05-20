import type { ComponentProps } from 'react';

import HorizontalDivider from '../../components/HorizontalDivider';

type SidebarRailDividerProps = ComponentProps<typeof HorizontalDivider>;

const SidebarRailDivider = (props: SidebarRailDividerProps) => (
	<HorizontalDivider mbs={16} mbe={16} mi={4} borderBlockStartColor='stroke-light' {...props} />
);

export default SidebarRailDivider;
