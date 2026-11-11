import { BackgroundLayer } from '@rocket.chat/layout';
import type { FieldPathValue, SubmitHandler, Validate } from 'react-hook-form';

import type { FormPageLayoutStyleProps } from '../../Types';
import FormPageLayout from '../../common/FormPageLayout';
import RegisterServerForm from '../../forms/RegisterServerForm';
import type { RegisterServerPayload } from '../../forms/RegisterServerForm/RegisterServerForm';

export type RegisterServerPageProps = {
	currentStep: number;
	stepCount: number;
	initialValues?: Partial<RegisterServerPayload>;
	onSubmit: SubmitHandler<RegisterServerPayload>;
	onClickRegisterOffline: () => void;
	offline?: boolean;
	validateEmail?: Validate<FieldPathValue<RegisterServerPayload, 'email'>, RegisterServerPayload>;
	termsHref?: string;
	policyHref?: string;
};

const pageLayoutStyleProps: FormPageLayoutStyleProps = {
	justifyContent: 'center',
};

const RegisterServerPage = (props: RegisterServerPageProps) => (
	<BackgroundLayer>
		<FormPageLayout styleProps={pageLayoutStyleProps}>
			<RegisterServerForm {...props} />
		</FormPageLayout>
	</BackgroundLayer>
);

export default RegisterServerPage;
