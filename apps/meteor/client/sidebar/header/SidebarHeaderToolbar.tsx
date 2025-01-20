import { useToolbar } from '@react-aria/toolbar';
import { TopBarActions } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useRef } from 'react';

const SidebarHeaderToolbar = (props: ComponentProps<typeof TopBarActions>) => {
	const ref = useRef(null);
	const { toolbarProps } = useToolbar(props, ref);

	return <TopBarActions small ref={ref} {...toolbarProps} {...props} />;
};

export default SidebarHeaderToolbar;
