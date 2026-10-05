import { BackgroundLayer } from '@rocket.chat/layout';
import type { ReactNode } from 'react';
import type { FieldPathValue, SubmitHandler, Validate } from 'react-hook-form';

import type { FormPageLayoutStyleProps } from '../../Types';
import FormPageLayout from '../../common/FormPageLayout';
import AdminInfoForm from '../../forms/AdminInfoForm';
import type { AdminInfoPayload } from '../../forms/AdminInfoForm/AdminInfoForm';

export type AdminInfoPageProps = {
	title?: ReactNode;
	description?: ReactNode;
	currentStep: number;
	stepCount: number;
	passwordRulesHint: string;
	keepPosted?: boolean;
	initialValues?: Omit<AdminInfoPayload, 'password'>;
	validateUsername: Validate<FieldPathValue<AdminInfoPayload, 'username'>, AdminInfoPayload>;
	validateEmail: Validate<FieldPathValue<AdminInfoPayload, 'email'>, AdminInfoPayload>;
	validatePassword: Validate<FieldPathValue<AdminInfoPayload, 'password'>, AdminInfoPayload>;
	onSubmit: SubmitHandler<AdminInfoPayload>;
};

const pageLayoutStyleProps: FormPageLayoutStyleProps = {
	justifyContent: 'center',
};

const AdminInfoPage = ({ title, description, ...props }: AdminInfoPageProps) => (
	<BackgroundLayer>
		<FormPageLayout title={title} styleProps={pageLayoutStyleProps} description={description}>
			<AdminInfoForm {...props} />
		</FormPageLayout>
	</BackgroundLayer>
);

export default AdminInfoPage;
