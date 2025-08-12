import { Sidebar } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useLayout, useSetting, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';

type SidebarHeaderActionHomeProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarHeaderActionHome = (props: SidebarHeaderActionHomeProps) => {
	const router = useRouter();
	const { sidebar } = useLayout();
	const showHome = useSetting('Layout_Show_Home_Button');
	const handleHome = useEffectEvent(() => {
		sidebar.toggle();
		router.navigate('/home');
	});
	const currentRoute = useCurrentRoutePath();

	return showHome ? <Sidebar.TopBar.Action {...props} icon='home' onClick={handleHome} pressed={currentRoute?.includes('/home')} /> : null;
};

export default SidebarHeaderActionHome;
