import {
	ActionLink,
	VerticalWizardLayout,
	VerticalWizardLayoutTitle,
	VerticalWizardLayoutForm,
	VerticalWizardLayoutFooter,
} from '@rocket.chat/layout';
import type { SubmitHandler } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import LoginForm from '../../forms/LoginForm';
import type { LoginFormPayload } from '../../forms/LoginForm/LoginForm';
import TotpForm from '../../forms/TotpForm';
import type { TotpFormPayload } from '../../forms/TotpForm/TotpForm';

export type TotpFormProps = {
	initialValues?: TotpFormPayload;
	onChangeTotpForm: () => void;
	isBackupCode?: boolean;
	formError?: string;
	onSubmit: SubmitHandler<TotpFormPayload>;
};

export type LoginPageProps = {
	initialValues?: Omit<LoginFormPayload, 'password'>;
	onChangeForm: () => void;
	onResetPassword: () => void;
	formError?: string;
	isPasswordLess: boolean;
	isMfa: boolean;
	onCreateAccount: () => void;
	mfaProps?: TotpFormProps;
	onSubmit: SubmitHandler<LoginFormPayload>;
};

const LoginPage = ({ onCreateAccount, ...props }: LoginPageProps) => {
	const { t } = useTranslation();
	const { isMfa, mfaProps } = props;

	return (
		<VerticalWizardLayout>
			<VerticalWizardLayoutTitle>{t('page.loginPage.title.cloud')}</VerticalWizardLayoutTitle>

			<VerticalWizardLayoutForm>{isMfa && !!mfaProps ? <TotpForm {...mfaProps} /> : <LoginForm {...props} />}</VerticalWizardLayoutForm>
			<VerticalWizardLayoutFooter>
				{!isMfa && (
					<Trans i18nKey='page.loginPage.createAccount.label'>
						New here?
						<ActionLink fontScale='p2' onClick={onCreateAccount}>
							Create account
						</ActionLink>
					</Trans>
				)}
			</VerticalWizardLayoutFooter>
		</VerticalWizardLayout>
	);
};

export default LoginPage;
