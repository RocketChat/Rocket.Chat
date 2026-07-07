import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { Form, FormContainer, FormHeader, FormTitle } from '@rocket.chat/layout';
import { useDocumentTitle } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';

const GuestForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }) => {
	const { t } = useTranslation();
	useDocumentTitle(t('registration.component.login'), false);

	return (
		<Form>
			<FormHeader>
				<FormTitle>{t('registration.page.guest.chooseHowToJoin')}</FormTitle>
			</FormHeader>
			<FormContainer>
				<ButtonGroup large stretch vertical>
					<Button primary onClick={() => setLoginRoute('login')}>
						{t('registration.page.guest.loginWithRocketChat')}
					</Button>
					<Button onClick={() => setLoginRoute('anonymous')}>{t('registration.page.guest.continueAsGuest')}</Button>
				</ButtonGroup>
			</FormContainer>
		</Form>
	);
};

export default GuestForm;
