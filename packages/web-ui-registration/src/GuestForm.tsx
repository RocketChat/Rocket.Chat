import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import { Form } from '@rocket.chat/layout';
import { useTranslation } from 'react-i18next';

import type { DispatchLoginRouter } from './hooks/useLoginRouter';

const GuestForm = ({ setLoginRoute }: { setLoginRoute: DispatchLoginRouter }) => {
	const { t } = useTranslation();

	return (
		<Form>
			<Form.Header>
				<Form.Title>{t('registration.page.guest.chooseHowToJoin')}</Form.Title>
			</Form.Header>
			<Form.Container>
				<ButtonGroup large stretch vertical>
					<Button primary onClick={() => setLoginRoute('login')}>
						{t('registration.page.guest.loginWithRocketChat')}
					</Button>
					<Button onClick={() => setLoginRoute('anonymous')}>{t('registration.page.guest.continueAsGuest')}</Button>
				</ButtonGroup>
			</Form.Container>
		</Form>
	);
};

export default GuestForm;
