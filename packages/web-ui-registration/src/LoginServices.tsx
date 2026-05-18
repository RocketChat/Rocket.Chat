import { Button, ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { useLoginServices, useSetting } from '@rocket.chat/ui-contexts';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import type { LoginErrorState } from './LoginForm';
import LoginServicesButton from './LoginServicesButton';

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

	if (services.length === 0) {
		return null;
	}

	const isDesktopApp = !!window.RocketChatDesktop?.openInBrowser;

	const handleLoginOnWeb = () => {
		if (!isDesktopApp) {
			return;
		}

		window.RocketChatDesktop?.openInBrowser(`${window.location.href}?loginClient=desktop`);
	};

	return (
		<>
			{showFormLogin && (
				<Divider mb={24} p={0}>
					{t('registration.component.form.divider')}
				</Divider>
			)}
			{!isDesktopApp && (
				<ButtonGroup vertical stretch small>
					{services.map((service) => (
						<LoginServicesButton disabled={disabled} key={service.service} {...service} setError={setError} />
					))}
				</ButtonGroup>
			)}
			{isDesktopApp && (
				<Button width='100%' primary onClick={handleLoginOnWeb}>
					{t('registration.component.login.onWeb')}
				</Button>
			)}
		</>
	);
};
export default LoginServices;
