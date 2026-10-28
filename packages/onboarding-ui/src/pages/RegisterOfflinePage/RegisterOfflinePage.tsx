import { BackgroundLayer } from '@rocket.chat/layout';
import type { SubmitHandler } from 'react-hook-form';

import type { FormPageLayoutStyleProps } from '../../Types';
import FormPageLayout from '../../common/FormPageLayout';
import RegisterOfflineForm from '../../forms/RegisterOfflineForm';
import type { RegisterOfflinePayload } from '../../forms/RegisterOfflineForm/RegisterOfflineForm';

export type RegisterOfflinePageProps = {
	termsHref: string;
	policyHref: string;
	clientKey: string;
	onSubmit: SubmitHandler<RegisterOfflinePayload>;
	onCopySecurityCode: () => void;
	onBackButtonClick: () => void;
};

const pageLayoutStyleProps: FormPageLayoutStyleProps = {
	justifyContent: 'center',
};

const RegisterOfflinePage = (props: RegisterOfflinePageProps) => (
	<BackgroundLayer>
		<FormPageLayout styleProps={pageLayoutStyleProps}>
			<RegisterOfflineForm {...props} />
		</FormPageLayout>
	</BackgroundLayer>
);

export default RegisterOfflinePage;
