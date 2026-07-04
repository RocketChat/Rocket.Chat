import { Callout } from '@rocket.chat/fuselage';
import { Form, FormContainer, FormFooter, FormHeader, FormTitle, ActionLink } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import { Trans, useTranslation } from 'react-i18next';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';

export const RegisterFormDisabled = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }) => {
	const linkReplacementText = useSetting('Accounts_RegistrationForm_LinkReplacementText', '');

	const { t } = useTranslation();

	return (
		<Form>
			<FormHeader>
				<FormTitle>{t('registration.component.form.register')}</FormTitle>
			</FormHeader>
			<FormContainer>
				<Callout role='status' type='warning'>
					{linkReplacementText}
				</Callout>
			</FormContainer>
			<FormFooter>
				<ActionLink
					onClick={(): void => {
						setLoginRoute('login');
					}}
				>
					<Trans i18nKey='registration.page.register.back'>Back to Login</Trans>
				</ActionLink>
			</FormFooter>
		</Form>
	);
};

export default RegisterFormDisabled;
