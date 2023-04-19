import { Callout } from '@rocket.chat/fuselage';
import { Form, ActionLink } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';

export const RegisterFormDisabled = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }): ReactElement => {
	const linkReplacementText = String(useSetting('Accounts_RegistrationForm_LinkReplacementText'));

	const { t } = useTranslation();

	return (
		<Form>
			<Form.Header>
				<Form.Title>{t('registration.component.form.register')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<Callout role='status' type='warning'>
					{linkReplacementText}
				</Callout>
			</Form.Container>
			<Form.Footer>
				<ActionLink
					onClick={(): void => {
						setLoginRoute('login');
					}}
				>
					<Trans i18nKey='registration.page.register.back'>Back to Login</Trans>
				</ActionLink>
			</Form.Footer>
		</Form>
	);
};

export default RegisterFormDisabled;
