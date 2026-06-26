import { NavBarItem } from '@rocket.chat/fuselage';
import { useSessionDispatch } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

type SidebarRailLoginPageProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const SidebarRailLoginPage = (props: SidebarRailLoginPageProps) => {
	const setForceLogin = useSessionDispatch('forceLogin');
	const { t } = useTranslation();

	return <NavBarItem {...props} icon='login' title={t('Login')} onClick={() => setForceLogin(true)} />;
};

export default SidebarRailLoginPage;
