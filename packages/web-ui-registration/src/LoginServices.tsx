import { Button, ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { useLoginServices, useSetting } from '@rocket.chat/ui-contexts';
import { useMemo, type Dispatch, type ReactElement, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import type { LoginErrorState } from './LoginForm';
import LoginServicesButton from './LoginServicesButton';

const servicesToBeShownOnDesktop = ['saml', 'cas', 'ldap'];

const LoginServices = ({
	disabled,
	setError,
}: {
	disabled?: boolean;
	setError: Dispatch<SetStateAction<LoginErrorState>>;
}): ReactElement | null => {
	const { t } = useTranslation();
	const services = useLoginServices();
	const showFormLogin = useSetting('Accounts_ShowFormLogin');

	const isDesktopApp = !!window.RocketChatDesktop?.openInBrowser;

	const servicesToShow = useMemo(
		() => (isDesktopApp ? services.filter(({ service }) => servicesToBeShownOnDesktop.includes(service)) : services),
		[isDesktopApp, services],
	);

	if (services.length === 0) {
		return null;
	}

	const handleLoginOnWeb = () => {
		if (!isDesktopApp) {
			return;
		}

		const redirectUrl = new URL(window.location.href);
		redirectUrl.searchParams.set('loginClient', 'desktop');

		window.RocketChatDesktop?.openInBrowser(redirectUrl.toString());
	};

	return (
		<>
			{showFormLogin && (
				<Divider mb={24} p={0}>
					{t('registration.component.form.divider')}
				</Divider>
			)}

			{servicesToShow.length > 0 && (
				<ButtonGroup vertical stretch small>
					{servicesToShow.map((service) => (
						<LoginServicesButton disabled={disabled} key={service.service} {...service} setError={setError} />
					))}
				</ButtonGroup>
			)}

			{isDesktopApp && (
				<Button width='100%' primary onClick={handleLoginOnWeb} marginBlockStart={4}>
					{t('registration.component.login.onWeb')}
				</Button>
			)}
		</>
	);
};
export default LoginServices;
