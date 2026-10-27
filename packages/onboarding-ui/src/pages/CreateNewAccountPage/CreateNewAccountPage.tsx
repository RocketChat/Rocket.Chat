import {
	ActionLink,
	VerticalWizardLayout,
	VerticalWizardLayoutFooter,
	VerticalWizardLayoutForm,
	VerticalWizardLayoutTitle,
} from '@rocket.chat/layout';
import type { FieldPathValue, SubmitHandler, Validate } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import NewAccountForm from '../../forms/NewAccountForm';
import type { NewAccountPayload } from '../../forms/NewAccountForm/NewAccountForm';

export type CreateNewAccountPageProps = {
	initialValues?: Omit<NewAccountPayload, 'password'>;
	validateEmail: Validate<FieldPathValue<NewAccountPayload, 'email'>, NewAccountPayload>;
	validatePassword: Validate<FieldPathValue<NewAccountPayload, 'password'>, NewAccountPayload>;
	validateConfirmationPassword: Validate<FieldPathValue<NewAccountPayload, 'confirmPassword'>, NewAccountPayload>;
	onSubmit: SubmitHandler<NewAccountPayload>;
	onLogin: () => void;
};

const CreateNewAccountPage = ({ onLogin, ...props }: CreateNewAccountPageProps) => {
	const { t } = useTranslation();
	return (
		<VerticalWizardLayout>
			<VerticalWizardLayoutTitle>{t('page.newAccountForm.title')}</VerticalWizardLayoutTitle>
			<VerticalWizardLayoutForm>
				<NewAccountForm {...props} />
			</VerticalWizardLayoutForm>
			<VerticalWizardLayoutFooter>
				<Trans i18nKey='component.createNewAccountPage'>
					Already registered?
					<ActionLink fontScale='h4' onClick={onLogin}>
						Go to login
					</ActionLink>
				</Trans>
			</VerticalWizardLayoutFooter>
		</VerticalWizardLayout>
	);
};

export default CreateNewAccountPage;
