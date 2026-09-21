import type { ComponentProps } from 'react';

import HorizontalDivider from '../../components/HorizontalDivider';

type SidebarRailDividerProps = ComponentProps<typeof HorizontalDivider>;

const SidebarRailDivider = (props: SidebarRailDividerProps) => (
	<HorizontalDivider marginBlock={16} marginInline={4} borderBlockStartColor='stroke-light' {...props} />
);

export default SidebarRailDivider;
