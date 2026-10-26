import { NavBarItem } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { isTruthy } from '@rocket.chat/tools';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useCurrentRoutePath, useLayout, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

export type NavBarPagesStackMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarPagesStackMenu = (props: NavBarPagesStackMenuProps) => {
	const { t } = useTranslation();

	const showHome = useSetting('Layout_Show_Home_Button');
	const { sidebar } = useLayout();
	const router = useRouter();

	const handleGoToHome = useStableCallback(() => {
		sidebar.toggle();
		router.navigate('/home');
	});

	const currentRoute = useCurrentRoutePath();
	const pressed = currentRoute?.includes('/directory') || currentRoute?.includes('/home');

	const items = [
		showHome && {
			id: 'home',
			icon: 'home' as const,
			content: t('Home'),
			onClick: handleGoToHome,
		},
		{
			id: 'directory',
			icon: 'notebook-hashtag' as const,
			content: t('Directory'),
			onClick: () => router.navigate('/directory'),
		},
	].filter(isTruthy);

	return (
		<GenericMenu items={items} title={t('Pages')} is={NavBarItem} placement='bottom-start' icon='stack' pressed={pressed} {...props} />
	);
};

export default NavBarPagesStackMenu;
