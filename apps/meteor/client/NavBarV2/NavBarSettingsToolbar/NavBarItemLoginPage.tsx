import { Button } from '@rocket.chat/fuselage';
import { useSessionDispatch } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

type NavBarItemLoginPageProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const NavBarItemLoginPage = (props: NavBarItemLoginPageProps) => {
	const setForceLogin = useSessionDispatch('forceLogin');
	const { t } = useTranslation();

	return (
		<Button primary small icon='login' onClick={(): void => setForceLogin(true)} {...props}>
			{t('Login')}
		</Button>
	);
};

export default NavBarItemLoginPage;
