import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useCurrentRoutePath, usePermission } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';

type NavBarItemDirectoryPageProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemDirectoryPage = (props: NavBarItemDirectoryPageProps) => {
	const router = useRouter();
	const canViewDirectory = usePermission('view-directory');
	const handleDirectory = useEffectEvent(() => {
		router.navigate('/directory');
	});
	const currentRoute = useCurrentRoutePath();

	if (!canViewDirectory) {
		return null;
	}

	return <NavBarItem {...props} icon='notebook-hashtag' onClick={handleDirectory} pressed={currentRoute?.includes('/directory')} />;
};

export default NavBarItemDirectoryPage;
