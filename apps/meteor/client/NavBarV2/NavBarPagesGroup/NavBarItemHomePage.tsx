import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useLayout, useSetting, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';

type NavBarItemHomePageProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemHomePage = (props: NavBarItemHomePageProps) => {
	const router = useRouter();
	const { sidebar } = useLayout();
	const showHome = useSetting('Layout_Show_Home_Button');
	const handleHome = useEffectEvent(() => {
		sidebar.toggle();
		router.navigate('/home');
	});
	const currentRoute = useCurrentRoutePath();

	return showHome ? <NavBarItem {...props} icon='home' onClick={handleHome} pressed={currentRoute?.includes('/home')} /> : null;
};

export default NavBarItemHomePage;
