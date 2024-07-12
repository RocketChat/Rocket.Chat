import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouter, useLayout, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import React from 'react';

import { NavbarAction } from '../../components/Navbar';

type NavbarHomeActionProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavbarHomeAction = (props: NavbarHomeActionProps) => {
	const t = useTranslation();
	const router = useRouter();
	const { sidebar } = useLayout();
	const showHome = useSetting('Layout_Show_Home_Button');

	const routeName = router.getLocationPathname();

	const handleHome = useMutableCallback(() => {
		sidebar.toggle();
		router.navigate('/home');
	});

	return showHome ? (
		<NavbarAction {...props}>
			<IconButton
				pressed={['/home', '/live', '/direct', '/group', '/channel'].some((name) => routeName?.startsWith(name))}
				title={t('Home')}
				medium
				icon='home'
				onClick={handleHome}
			/>
		</NavbarAction>
	) : null;
};

export default NavbarHomeAction;
