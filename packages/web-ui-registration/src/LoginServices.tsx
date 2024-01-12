import { ButtonGroup, Divider } from '@rocket.chat/fuselage';
import { AuthenticationContext, useSetting } from '@rocket.chat/ui-contexts';
import { useContext } from 'react';
import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import type { LoginErrors } from './LoginForm';
import LoginServicesButton from './LoginServicesButton';

const LoginServices = ({
	disabled,
	setError,
}: {
	disabled?: boolean;
	setError: Dispatch<SetStateAction<LoginErrors | undefined>>;
}): ReactElement | null => {
	const { t } = useTranslation();
	const { getLoginServices } = useContext(AuthenticationContext);
	const services = getLoginServices();
	const showFormLogin = useSetting('Accounts_ShowFormLogin');

	if (services.length === 0) {
		return null;
	}

	return (
		<>
			{showFormLogin && <Divider mb={24} p={0} children={t('registration.component.form.divider')} />}
			<ButtonGroup vertical stretch small>
				{services.map((service) => (
					<LoginServicesButton disabled={disabled} key={service.service} {...service} setError={setError} />
				))}
			</ButtonGroup>
		</>
	);
};
export default LoginServices;
