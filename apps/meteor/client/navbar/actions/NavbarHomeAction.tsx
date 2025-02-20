import { IconButton } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useLayout, useSetting } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import { NavbarAction } from '../../components/Navbar';

type NavbarHomeActionProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavbarHomeAction = (props: NavbarHomeActionProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const { sidebar } = useLayout();
	const showHome = useSetting('Layout_Show_Home_Button');

	const routeName = router.getLocationPathname();

	const handleHome = useEffectEvent(() => {
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
