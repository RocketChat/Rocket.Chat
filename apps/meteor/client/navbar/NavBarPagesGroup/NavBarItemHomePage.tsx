import { NavBarItem } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter, useLayout, useSetting, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';

type NavBarItemHomePageProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemHomePage = (props: NavBarItemHomePageProps) => {
	const router = useRouter();
	const { sidebar } = useLayout();
	const showHome = useSetting('Layout_Show_Home_Button');
	const handleHome = useStableCallback(() => {
		sidebar.toggle();
		router.navigate('/home');
	});
	const currentRoute = useCurrentRoutePath();

	const homeRoute = currentRoute?.includes('/home');

	return showHome ? (
		<NavBarItem {...props} icon='home' onClick={handleHome} aria-current={homeRoute ? 'page' : undefined} pressed={homeRoute} />
	) : null;
};

export default NavBarItemHomePage;
