import { Box } from '@rocket.chat/fuselage';
import { ActionLink } from '@rocket.chat/layout';
import type { FieldPathValue, SubmitHandler, Validate } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import type { FormPageLayoutStyleProps } from '../../Types';
import FormPageLayout from '../../common/FormPageLayout';
import CreateNewPasswordForm from '../../forms/CreateNewPassword';
import type { CreateNewPasswordPayload } from '../../forms/CreateNewPassword/CreateNewPassword';

export type CreateNewPasswordPageProps = {
	initialValues?: CreateNewPasswordPayload;
	validatePassword: Validate<FieldPathValue<CreateNewPasswordPayload, 'password'>, CreateNewPasswordPayload>;
	validatePasswordConfirmation: Validate<FieldPathValue<CreateNewPasswordPayload, 'passwordConfirmation'>, CreateNewPasswordPayload>;
	onSubmit: SubmitHandler<CreateNewPasswordPayload>;
	onLogin: () => void;
};

const pageLayoutStyleProps: FormPageLayoutStyleProps = {
	justifyContent: 'center',
};

const ResetPasswordPage = ({ onLogin, ...props }: CreateNewPasswordPageProps) => {
	const { t } = useTranslation();
	return (
		<FormPageLayout title={t('page.createPasswordPage.title')} styleProps={pageLayoutStyleProps}>
			<CreateNewPasswordForm {...props} />
			<Box fontScale='p2' paddingBlockStart={40}>
				<Trans i18nKey='component.wantToLogin'>
					Want to log in?
					<ActionLink fontScale='p2' onClick={onLogin}>
						Go to login
					</ActionLink>
				</Trans>
			</Box>
		</FormPageLayout>
	);
};

export default ResetPasswordPage;
