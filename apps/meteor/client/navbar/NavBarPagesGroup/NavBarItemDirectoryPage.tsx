import { NavBarItem } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useCurrentRoutePath } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';

type NavBarItemDirectoryPageProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemDirectoryPage = (props: NavBarItemDirectoryPageProps) => {
	const router = useRouter();
	const handleDirectory = useEffectEvent(() => {
		router.navigate('/directory');
	});
	const currentRoute = useCurrentRoutePath();

	const directoryRoute = currentRoute?.includes('/directory');

	return (
		<NavBarItem
			{...props}
			icon='notebook-hashtag'
			onClick={handleDirectory}
			aria-current={directoryRoute ? 'page' : undefined}
			pressed={directoryRoute}
		/>
	);
};

export default NavBarItemDirectoryPage;
